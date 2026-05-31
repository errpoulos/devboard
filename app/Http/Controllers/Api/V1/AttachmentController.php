<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Resources\AttachmentResource;
use App\Models\Attachment;
use App\Models\Board;
use App\Models\Task;
use App\Models\Workspace;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class AttachmentController extends Controller
{
    public function index(Workspace $workspace, Board $board, Task $task): AnonymousResourceCollection
    {
        $this->authorize('view', $workspace);

        return AttachmentResource::collection(
            $task->attachments()->with('user')->latest()->get()
        );
    }

    public function store(Request $request, Workspace $workspace, Board $board, Task $task): AttachmentResource
    {
        $this->authorize('update', $workspace);

        $request->validate([
            'file' => ['required', 'file', 'max:20480'],
        ]);

        $file = $request->file('file');
        $uuid = Str::uuid();

        Storage::disk('local')->putFileAs(
            "task-attachments/{$task->id}/{$uuid}",
            $file,
            $file->getClientOriginalName()
        );

        $attachment = Attachment::create([
            'task_id' => $task->id,
            'user_id' => $request->user()->id,
            'filename' => $file->getClientOriginalName(),
            'disk' => 'local',
            'path' => "task-attachments/{$task->id}/{$uuid}/{$file->getClientOriginalName()}",
            'mime_type' => $file->getMimeType(),
            'size' => $file->getSize(),
        ]);

        $attachment->load('user');

        return new AttachmentResource($attachment);
    }

    public function download(Workspace $workspace, Board $board, Task $task, Attachment $attachment): mixed
    {
        $this->authorize('view', $workspace);
        abort_unless($attachment->task_id === $task->id, 404);

        return Storage::disk($attachment->disk)->download($attachment->path, $attachment->filename);
    }

    public function destroy(Workspace $workspace, Board $board, Task $task, Attachment $attachment): JsonResponse
    {
        $this->authorize('update', $workspace);
        abort_unless($attachment->task_id === $task->id, 404);

        Storage::disk($attachment->disk)->delete($attachment->path);
        $attachment->delete();

        return response()->json(['message' => 'Deleted.']);
    }
}
