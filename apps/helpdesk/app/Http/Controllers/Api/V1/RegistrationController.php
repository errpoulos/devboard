<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Resources\UserResource;
use App\Models\Organization;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;

class RegistrationController extends Controller
{
    public function store(Request $request): UserResource
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'email', 'unique:users,email'],
            'password' => ['required', 'string', 'min:8', 'confirmed'],
            'org_slug' => ['sometimes', 'string', 'exists:organizations,slug'],
        ]);

        $user = User::create([
            'name' => $validated['name'],
            'email' => $validated['email'],
            'password' => Hash::make($validated['password']),
            'role' => null,
        ]);

        if (! empty($validated['org_slug'])) {
            $org = Organization::where('slug', $validated['org_slug'])->first();
            if ($org) {
                $user->organizations()->attach($org->id);
                $user->update(['organization_id' => $org->id]);
            }
        }

        $user->load('organizations');

        Auth::login($user);
        $request->session()->regenerate();

        return new UserResource($user);
    }
}
