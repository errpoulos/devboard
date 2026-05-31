<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Resources\TicketAttachmentResource;
use App\Models\Ticket;
use App\Models\TicketAttachment;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class TicketAttachmentController extends Controller
{
    public function index(Ticket $ticket): AnonymousResourceCollection
    {
        $this->authorize('view', $ticket);

        return TicketAttachmentResource::collection(
            $ticket->attachments()->with('user')->latest()->get()
        );
    }

    public function store(Request $request, Ticket $ticket): TicketAttachmentResource
    {
        $this->authorize('view', $ticket);

        $request->validate([
            'file' => ['required', 'file', 'max:20480'],
        ]);

        $file = $request->file('file');
        $uuid = Str::uuid();
        $path = "ticket-attachments/{$ticket->id}/{$uuid}/{$file->getClientOriginalName()}";

        Storage::disk('local')->putFileAs(
            "ticket-attachments/{$ticket->id}/{$uuid}",
            $file,
            $file->getClientOriginalName()
        );

        $attachment = TicketAttachment::create([
            'ticket_id' => $ticket->id,
            'user_id' => $request->user()->id,
            'filename' => $file->getClientOriginalName(),
            'disk' => 'local',
            'path' => $path,
            'mime_type' => $file->getMimeType(),
            'size' => $file->getSize(),
        ]);

        $attachment->load('user');

        return new TicketAttachmentResource($attachment);
    }

    public function download(Ticket $ticket, TicketAttachment $attachment): mixed
    {
        $this->authorize('view', $ticket);

        abort_unless($attachment->ticket_id === $ticket->id, 404);

        return Storage::disk($attachment->disk)->download($attachment->path, $attachment->filename);
    }

    public function destroy(Ticket $ticket, TicketAttachment $attachment): JsonResponse
    {
        $this->authorize('view', $ticket);

        abort_unless($attachment->ticket_id === $ticket->id, 404);

        $user = request()->user();
        abort_unless(
            $attachment->user_id === $user->id || $user->isAgent(),
            403
        );

        Storage::disk($attachment->disk)->delete($attachment->path);
        $attachment->delete();

        return response()->json(['message' => 'Deleted.']);
    }
}
