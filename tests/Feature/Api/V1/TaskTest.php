<?php

use App\Events\TaskCreated;
use App\Events\TaskDeleted;
use App\Events\TaskUpdated;
use App\Models\Board;
use App\Models\BoardColumn;
use App\Models\Task;
use App\Models\User;
use App\Models\Workspace;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Event;
use Laravel\Sanctum\Sanctum;

uses(RefreshDatabase::class);

beforeEach(function () {
    $this->user = User::factory()->create();
    $this->workspace = Workspace::create([
        'name' => 'Test WS',
        'slug' => 'test-ws',
        'owner_id' => $this->user->id,
    ]);
    $this->workspace->members()->attach($this->user->id, ['role' => 'owner']);

    $this->board = Board::create([
        'workspace_id' => $this->workspace->id,
        'name' => 'Board',
    ]);
    $this->column = $this->board->columns()->create([
        'name' => 'To Do',
        'position' => 0,
    ]);

    app()->instance('current.workspace', $this->workspace);

    Sanctum::actingAs($this->user, ['*']);
});

it('creates a task and dispatches TaskCreated event', function () {
    Event::fake([TaskCreated::class]);

    $this->postJson("/api/v1/workspaces/{$this->workspace->id}/boards/{$this->board->id}/tasks", [
        'title' => 'New Task',
        'board_column_id' => $this->column->id,
    ])
        ->assertCreated()
        ->assertJsonStructure(['data' => ['id', 'title', 'board_column_id']]);

    Event::assertDispatched(TaskCreated::class);
});

it('returns 422 when title is missing', function () {
    $this->postJson("/api/v1/workspaces/{$this->workspace->id}/boards/{$this->board->id}/tasks", [
        'board_column_id' => $this->column->id,
    ])
        ->assertUnprocessable()
        ->assertJsonValidationErrors(['title']);
});
