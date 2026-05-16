<?php

use App\DTOs\StoreTaskDTO;
use App\Events\TaskCreated;
use App\Models\Board;
use App\Models\User;
use App\Models\Workspace;
use App\Services\TaskService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Event;

uses(RefreshDatabase::class);

it('creates a task at the correct position', function () {
    Event::fake();

    $user = User::factory()->create();
    $workspace = Workspace::create(['name' => 'WS', 'slug' => 'ws', 'owner_id' => $user->id]);
    $workspace->members()->attach($user->id, ['role' => 'owner']);

    app()->instance('current.workspace', $workspace);

    $board = Board::create(['workspace_id' => $workspace->id, 'name' => 'B']);
    $column = $board->columns()->create(['name' => 'Col', 'position' => 0]);

    $service = new TaskService;

    $dto = new StoreTaskDTO('Task A', null, null, $column->id, 'medium', null);
    $task1 = $service->create($board, $dto, $user);

    $dto2 = new StoreTaskDTO('Task B', null, null, $column->id, 'medium', null);
    $task2 = $service->create($board, $dto2, $user);

    expect($task1->position)->toBeLessThan($task2->position);
});
