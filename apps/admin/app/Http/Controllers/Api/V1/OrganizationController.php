<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Resources\OrganizationResource;
use App\Models\Organization;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

class OrganizationController extends Controller
{
    public function index(): AnonymousResourceCollection
    {
        $organizations = Organization::withCount('users')
            ->orderBy('name')
            ->paginate(25);

        return OrganizationResource::collection($organizations);
    }

    public function show(Organization $organization): OrganizationResource
    {
        $organization->loadCount('users')->load('users');

        return new OrganizationResource($organization);
    }

    public function update(Request $request, Organization $organization): OrganizationResource
    {
        $validated = $request->validate([
            'plan' => ['sometimes', 'string', 'in:free,pro,enterprise'],
            'status' => ['sometimes', 'string', 'in:trial,active,suspended'],
        ]);

        $organization->update($validated);

        return new OrganizationResource($organization->loadCount('users'));
    }

    public function destroy(Organization $organization): JsonResponse
    {
        $organization->delete();

        return response()->json(['message' => 'Organization deleted.']);
    }
}
