<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreContactRequest;
use App\Http\Resources\ContactResource;
use App\Models\Contact;
use App\Services\CrmService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

class ContactController extends Controller
{
    public function __construct(private readonly CrmService $crmService) {}

    public function index(Request $request): AnonymousResourceCollection
    {
        $contacts = $this->crmService->getContacts($request->user());

        return ContactResource::collection($contacts);
    }

    public function store(StoreContactRequest $request): ContactResource
    {
        $this->authorize('create', Contact::class);

        $contact = $this->crmService->createContact($request->user(), $request->validated());

        return new ContactResource($contact);
    }

    public function destroy(Request $request, Contact $contact): JsonResponse
    {
        $this->authorize('delete', $contact);

        $this->crmService->deleteContact($contact);

        return response()->json(['message' => 'Contact deleted.']);
    }
}
