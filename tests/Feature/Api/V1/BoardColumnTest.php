<?php

use App\Models\Board;
use App\Models\BoardColumn;
use App\Models\User;
use App\Models\Workspace;
use App\Services\BoardService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;

uses(RefreshDatabase::class);

beforeEach(function () {
    $this->user = User::factory()->create();

    $this->workspace = Workspace::factory()->create(['owner_id' => $this->user->id]);
    $this->workspace->members()->attach($this->user->id, ['role' => 'owner']);

    $this->board = app(BoardService::class)->create(
        workspace: $this->workspace,
        data: new \App\DTOs\StoreBoardDTO('Test Board', null),
    );

    app()->instance('current.workspace', $this->workspace);

    Sanctum::actingAs($this->user, ['*']);
});

it('creates a new column', function () {
    $this->postJson("/api/v1/workspaces/{$this->workspace->id}/boards/{$this->board->id}/columns", [
        'name' => 'Backlog',
    ])
        ->assertCreated()
        ->assertJsonFragment(['name' => 'Backlog']);

    $this->assertDatabaseHas('board_columns', ['board_id' => $this->board->id, 'name' => 'Backlog']);
});

it('returns 422 when column name is missing', function () {
    $this->postJson("/api/v1/workspaces/{$this->workspace->id}/boards/{$this->board->id}/columns", [])
        ->assertUnprocessable()
        ->assertJsonValidationErrors(['name']);
});

it('updates a column name', function () {
    $column = $this->board->columns->first();

    $this->patchJson("/api/v1/workspaces/{$this->workspace->id}/boards/{$this->board->id}/columns/{$column->id}", [
        'name' => 'Renamed',
    ])
        ->assertOk()
        ->assertJsonFragment(['name' => 'Renamed']);

    $this->assertDatabaseHas('board_columns', ['id' => $column->id, 'name' => 'Renamed']);
});

it('deletes a column', function () {
    $column = $this->board->columns->first();

    $this->deleteJson("/api/v1/workspaces/{$this->workspace->id}/boards/{$this->board->id}/columns/{$column->id}")
        ->assertNoContent();

    $this->assertDatabaseMissing('board_columns', ['id' => $column->id]);
});

it('forbids column creation for plain members', function () {
    $member = User::factory()->create();
    $this->workspace->members()->attach($member->id, ['role' => 'member']);
    Sanctum::actingAs($member, ['*']);

    $this->postJson("/api/v1/workspaces/{$this->workspace->id}/boards/{$this->board->id}/columns", [
        'name' => 'Blocked',
    ])
        ->assertForbidden();
});

it('reorders columns', function () {
    $columns = $this->board->columns->sortBy('position')->values();
    $reversedIds = $columns->pluck('id')->reverse()->values()->all();

    $this->postJson("/api/v1/workspaces/{$this->workspace->id}/boards/{$this->board->id}/columns/reorder", [
        'ordered_ids' => $reversedIds,
    ])
        ->assertNoContent();

    foreach ($reversedIds as $newPosition => $columnId) {
        $this->assertDatabaseHas('board_columns', ['id' => $columnId, 'position' => $newPosition]);
    }
});
