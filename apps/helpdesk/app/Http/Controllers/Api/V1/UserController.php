<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Resources\UserResource;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Routing\Controller;

class UserController extends Controller
{
    public function agents(Request $request): AnonymousResourceCollection
    {
        if (! $request->user()->isAgent()) {
            abort(403);
        }

        $agents = User::where('organization_id', $request->user()->organization_id)
            ->whereIn('role', ['agent', 'administrator'])
            ->get();

        return UserResource::collection($agents);
    }

    public function show(Request $request, User $user): UserResource
    {
        if (! $request->user()->isAgent()) {
            abort(403);
        }

        return new UserResource($user->load('organization'));
    }
}
