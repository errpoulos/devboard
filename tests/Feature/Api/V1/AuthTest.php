<?php

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

it('returns the authenticated user', function () {
    $user = User::factory()->create();

    $this->actingAs($user)
        ->getJson('/api/v1/auth/me')
        ->assertOk()
        ->assertJsonStructure(['data' => ['id', 'name', 'email']]);
});

it('rejects unauthenticated requests to /me', function () {
    $this->getJson('/api/v1/auth/me')->assertUnauthorized();
});
