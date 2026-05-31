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

class AdminController extends Controller
{
    public function index(Request $request): AnonymousResourceCollection
    {
        if (! $request->user()->is_super_admin) {
            abort(403);
        }

        $users = User::where('organization_id', $request->user()->organization_id)
            ->orderBy('name')
            ->get();

        return UserResource::collection($users);
    }

    public function store(Request $request)
    {
        if (! $request->user()->is_super_admin) {
            abort(403);
        }

        $validated = $request->validate([
            'email' => 'required|email',
            'name' => 'required|string|max:255',
            'is_super_admin' => 'boolean',
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
                'is_super_admin' => $validated['is_super_admin'] ?? false,
            ]);
        } else {
            $user->update([
                'name' => $validated['name'],
                'is_super_admin' => $validated['is_super_admin'] ?? $user->is_super_admin,
            ]);
        }

        $response = ['data' => (new UserResource($user))->resolve($request)];
        if ($tempPassword) {
            $response['temp_password'] = $tempPassword;
        }

        return response()->json($response, $user->wasRecentlyCreated ? 201 : 200);
    }

    public function update(Request $request, User $user): UserResource
    {
        if (! $request->user()->is_super_admin) {
            abort(403);
        }

        $validated = $request->validate([
            'name' => 'sometimes|string|max:255',
            'is_super_admin' => 'sometimes|boolean',
        ]);

        $user->update($validated);

        return new UserResource($user);
    }

    public function destroy(Request $request, User $user): Response
    {
        if (! $request->user()->is_super_admin) {
            abort(403);
        }

        if ($user->id === $request->user()->id) {
            abort(422, 'You cannot remove yourself.');
        }

        $user->delete();

        return response()->noContent();
    }
}
