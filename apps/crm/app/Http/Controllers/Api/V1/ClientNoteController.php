<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Resources\ClientNoteResource;
use App\Models\ClientNote;
use App\Models\Company;
use App\Models\Contact;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Http\Response;

class ClientNoteController extends Controller
{
    public function indexForContact(Request $request, Contact $contact): AnonymousResourceCollection
    {
        $this->authorizeOrgAccess($request, $contact->organization_id);

        $notes = ClientNote::where(function ($q) use ($contact) {
                $matchedUser = User::where('email', $contact->email)->first();
                if ($matchedUser) {
                    $q->where('subject_user_id', $matchedUser->id);
                } else {
                    $q->where('organization_id', $contact->organization_id)
                      ->whereNull('subject_user_id');
                }
            })
            ->with('author')
            ->orderBy('created_at')
            ->get();

        return ClientNoteResource::collection($notes);
    }

    public function storeForContact(Request $request, Contact $contact): ClientNoteResource
    {
        $this->authorizeOrgAccess($request, $contact->organization_id);

        $validated = $request->validate(['body' => ['required', 'string']]);

        $matchedUser = User::where('email', $contact->email)->first();

        $note = ClientNote::create([
            'category' => 'sales',
            'organization_id' => $contact->organization_id,
            'subject_user_id' => $matchedUser?->id,
            'author_id' => $request->user()->id,
            'body' => $validated['body'],
        ]);

        return new ClientNoteResource($note->load('author'));
    }

    public function indexForCompany(Request $request, Company $company): AnonymousResourceCollection
    {
        $this->authorizeOrgAccess($request, $company->organization_id);

        $notes = ClientNote::where('organization_id', $company->organization_id)
            ->whereNull('subject_user_id')
            ->with('author')
            ->orderBy('created_at')
            ->get();

        return ClientNoteResource::collection($notes);
    }

    public function storeForCompany(Request $request, Company $company): ClientNoteResource
    {
        $this->authorizeOrgAccess($request, $company->organization_id);

        $validated = $request->validate(['body' => ['required', 'string']]);

        $note = ClientNote::create([
            'category' => 'sales',
            'organization_id' => $company->organization_id,
            'subject_user_id' => null,
            'author_id' => $request->user()->id,
            'body' => $validated['body'],
        ]);

        return new ClientNoteResource($note->load('author'));
    }

    public function update(Request $request, ClientNote $note): ClientNoteResource
    {
        $this->authorizeOrgAccess($request, $note->organization_id);

        if ($note->author_id !== $request->user()->id) {
            abort(403);
        }

        $validated = $request->validate(['body' => ['required', 'string']]);
        $note->update(['body' => $validated['body']]);

        return new ClientNoteResource($note->load('author'));
    }

    public function destroy(Request $request, ClientNote $note): Response
    {
        $this->authorizeOrgAccess($request, $note->organization_id);

        if ($note->author_id !== $request->user()->id) {
            abort(403);
        }

        $note->delete();

        return response()->noContent();
    }

    private function authorizeOrgAccess(Request $request, ?int $resourceOrgId): void
    {
        $user = $request->user();
        if (! $user->is_super_admin && $user->organization_id !== $resourceOrgId) {
            abort(403);
        }
    }
}
