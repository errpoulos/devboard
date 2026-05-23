<?php

use App\Models\User;
use App\Models\Workspace;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;

uses(RefreshDatabase::class);

beforeEach(function () {
    $this->user = User::factory()->create();
    Sanctum::actingAs($this->user, ['*']);
});

it('lists only workspaces the user belongs to', function () {
    $own = Workspace::factory()->create(['owner_id' => $this->user->id]);
    $own->members()->attach($this->user->id, ['role' => 'owner']);

    Workspace::factory()->create(); // workspace user is NOT a member of

    $this->getJson('/api/v1/workspaces')
        ->assertOk()
        ->assertJsonCount(1, 'data')
        ->assertJsonFragment(['id' => $own->id]);
});

it('creates a workspace and makes the creator an owner', function () {
    $this->postJson('/api/v1/workspaces', ['name' => 'My Team', 'slug' => 'my-team'])
        ->assertCreated()
        ->assertJsonStructure(['data' => ['id', 'name', 'slug']]);

    $this->assertDatabaseHas('workspaces', ['name' => 'My Team', 'owner_id' => $this->user->id]);
    $this->assertDatabaseHas('workspace_user', ['user_id' => $this->user->id, 'role' => 'owner']);
});

it('returns 422 when workspace name is missing', function () {
    $this->postJson('/api/v1/workspaces', ['slug' => 'my-team'])
        ->assertUnprocessable()
        ->assertJsonValidationErrors(['name']);
});

it('shows a workspace the user is a member of', function () {
    $workspace = Workspace::factory()->create(['owner_id' => $this->user->id]);
    $workspace->members()->attach($this->user->id, ['role' => 'owner']);

    $this->getJson("/api/v1/workspaces/{$workspace->id}")
        ->assertOk()
        ->assertJsonFragment(['id' => $workspace->id]);
});

it('forbids viewing a workspace the user does not belong to', function () {
    $workspace = Workspace::factory()->create();

    $this->getJson("/api/v1/workspaces/{$workspace->id}")
        ->assertForbidden();
});

it('updates workspace name when user is owner', function () {
    $workspace = Workspace::factory()->create(['owner_id' => $this->user->id]);
    $workspace->members()->attach($this->user->id, ['role' => 'owner']);

    $this->patchJson("/api/v1/workspaces/{$workspace->id}", ['name' => 'Renamed', 'slug' => $workspace->slug])
        ->assertOk()
        ->assertJsonFragment(['name' => 'Renamed']);

    $this->assertDatabaseHas('workspaces', ['id' => $workspace->id, 'name' => 'Renamed']);
});

it('forbids updating a workspace when user is a plain member', function () {
    $owner = User::factory()->create();
    $workspace = Workspace::factory()->create(['owner_id' => $owner->id]);
    $workspace->members()->attach($owner->id, ['role' => 'owner']);
    $workspace->members()->attach($this->user->id, ['role' => 'member']);

    $this->patchJson("/api/v1/workspaces/{$workspace->id}", ['name' => 'Hacked', 'slug' => $workspace->slug])
        ->assertForbidden();
});

it('deletes a workspace when user is the owner', function () {
    $workspace = Workspace::factory()->create(['owner_id' => $this->user->id]);
    $workspace->members()->attach($this->user->id, ['role' => 'owner']);

    $this->deleteJson("/api/v1/workspaces/{$workspace->id}")
        ->assertNoContent();

    $this->assertDatabaseMissing('workspaces', ['id' => $workspace->id]);
});

it('forbids deleting a workspace when user is not the owner', function () {
    $owner = User::factory()->create();
    $workspace = Workspace::factory()->create(['owner_id' => $owner->id]);
    $workspace->members()->attach($owner->id, ['role' => 'owner']);
    $workspace->members()->attach($this->user->id, ['role' => 'admin']);

    $this->deleteJson("/api/v1/workspaces/{$workspace->id}")
        ->assertForbidden();
});
