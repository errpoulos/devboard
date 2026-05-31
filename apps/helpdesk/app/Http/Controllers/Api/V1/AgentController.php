<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Resources\UserResource;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Http\Response;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

class AgentController extends Controller
{
    public function index(Request $request): AnonymousResourceCollection
    {
        if (! $request->user()->isAdmin()) {
            abort(403);
        }

        $members = User::where('organization_id', $request->user()->organization_id)
            ->whereIn('role', ['agent', 'administrator'])
            ->orderBy('name')
            ->get();

        return UserResource::collection($members);
    }

    public function store(Request $request)
    {
        if (! $request->user()->isAdmin()) {
            abort(403);
        }

        $validated = $request->validate([
            'email' => 'required|email',
            'name' => 'required|string|max:255',
            'role' => 'required|in:agent,administrator',
        ]);

        $orgId = $request->user()->organization_id;

        $user = User::where('organization_id', $orgId)
            ->where('email', $validated['email'])
            ->first();

        $tempPassword = null;

        if (! $user) {
            if (User::where('email', $validated['email'])->exists()) {
                return response()->json([
                    'message' => 'That email is already registered to a different organization.',
                    'errors' => ['email' => ['That email is already registered to a different organization.']],
                ], 422);
            }

            $tempPassword = Str::random(4).'-'.Str::random(4).'-'.Str::random(4);

            $user = User::create([
                'name' => $validated['name'],
                'email' => $validated['email'],
                'password' => Hash::make($tempPassword),
                'organization_id' => $orgId,
                'role' => $validated['role'],
            ]);
        } else {
            $user->update(['name' => $validated['name'], 'role' => $validated['role']]);
        }

        $response = ['data' => (new UserResource($user))->resolve($request)];
        if ($tempPassword) {
            $response['temp_password'] = $tempPassword;
        }

        return response()->json($response, $user->wasRecentlyCreated ? 201 : 200);
    }

    public function update(Request $request, User $user): UserResource
    {
        if (! $request->user()->isAdmin()) {
            abort(403);
        }

        $validated = $request->validate([
            'name' => 'sometimes|string|max:255',
            'role' => 'sometimes|in:agent,administrator,customer',
        ]);

        $user->update($validated);

        return new UserResource($user);
    }

    public function destroy(Request $request, User $user): Response
    {
        if (! $request->user()->isAdmin()) {
            abort(403);
        }

        $user->update(['role' => null]);

        return response()->noContent();
    }
}
