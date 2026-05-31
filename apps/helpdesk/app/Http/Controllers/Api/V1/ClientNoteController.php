<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Resources\ClientNoteResource;
use App\Models\ClientNote;
use App\Models\Organization;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Http\Response;
use Illuminate\Routing\Controller;

class ClientNoteController extends Controller
{
    public function indexForUser(Request $request, User $user): AnonymousResourceCollection
    {
        if (! $request->user()->isAgent()) {
            abort(403);
        }

        $notes = ClientNote::where('subject_user_id', $user->id)
            ->with('author')
            ->orderBy('created_at')
            ->get();

        return ClientNoteResource::collection($notes);
    }

    public function storeForUser(Request $request, User $user): ClientNoteResource
    {
        if (! $request->user()->isAgent()) {
            abort(403);
        }

        $validated = $request->validate([
            'body' => ['required', 'string'],
        ]);

        $note = ClientNote::create([
            'category' => 'support',
            'subject_user_id' => $user->id,
            'author_id' => $request->user()->id,
            'organization_id' => $user->organization_id,
            'body' => $validated['body'],
        ]);

        return new ClientNoteResource($note->load('author'));
    }

    public function indexForOrg(Request $request, Organization $org): AnonymousResourceCollection
    {
        if (! $request->user()->isAgent()) {
            abort(403);
        }

        $notes = ClientNote::where('organization_id', $org->id)
            ->whereNull('subject_user_id')
            ->with('author')
            ->orderBy('created_at')
            ->get();

        return ClientNoteResource::collection($notes);
    }

    public function storeForOrg(Request $request, Organization $org): ClientNoteResource
    {
        if (! $request->user()->isAgent()) {
            abort(403);
        }

        $validated = $request->validate([
            'body' => ['required', 'string'],
        ]);

        $note = ClientNote::create([
            'category' => 'support',
            'organization_id' => $org->id,
            'subject_user_id' => null,
            'author_id' => $request->user()->id,
            'body' => $validated['body'],
        ]);

        return new ClientNoteResource($note->load('author'));
    }

    public function update(Request $request, ClientNote $note): ClientNoteResource
    {
        if (! $request->user()->isAgent()) {
            abort(403);
        }

        if ($note->author_id !== $request->user()->id) {
            abort(403);
        }

        $validated = $request->validate([
            'body' => ['required', 'string'],
        ]);

        $note->update(['body' => $validated['body']]);

        return new ClientNoteResource($note->load('author'));
    }

    public function destroy(Request $request, ClientNote $note): Response
    {
        if (! $request->user()->isAgent()) {
            abort(403);
        }

        if ($note->author_id !== $request->user()->id) {
            abort(403);
        }

        $note->delete();

        return response()->noContent();
    }
}
