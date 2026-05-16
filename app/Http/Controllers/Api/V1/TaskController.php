<?php

namespace App\Http\Controllers\Api\V1;

use App\DTOs\StoreTaskDTO;
use App\DTOs\UpdateTaskDTO;
use App\Http\Controllers\Controller;
use App\Http\Requests\StoreTaskRequest;
use App\Http\Requests\UpdateTaskRequest;
use App\Http\Resources\TaskResource;
use App\Models\Board;
use App\Models\Task;
use App\Models\Workspace;
use App\Services\TaskService;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\ResourceCollection;
use Illuminate\Http\Response;

class TaskController extends Controller
{
    public function __construct(private readonly TaskService $taskService) {}

    public function index(Request $request, Workspace $workspace, Board $board): ResourceCollection
    {
        $tasks = Task::with(['assignee'])
            ->whereIn('board_column_id', $board->columns->pluck('id'))
            ->cursorPaginate(25);

        return TaskResource::collection($tasks);
    }

    public function store(StoreTaskRequest $request, Workspace $workspace, Board $board): TaskResource
    {
        $this->authorize('create', Task::class);

        $task = $this->taskService->create(
            board: $board,
            data: StoreTaskDTO::fromRequest($request),
            actor: $request->user(),
        );

        return new TaskResource($task);
    }

    public function show(Workspace $workspace, Board $board, Task $task): TaskResource
    {
        $this->authorize('view', $task);

        return new TaskResource(
            $task->load(['assignee', 'comments.user', 'attachments'])
        );
    }

    public function update(UpdateTaskRequest $request, Workspace $workspace, Board $board, Task $task): TaskResource
    {
        $this->authorize('update', $task);

        $task = $this->taskService->update(
            task: $task,
            data: UpdateTaskDTO::fromRequest($request),
            actor: $request->user(),
        );

        return new TaskResource($task);
    }

    public function destroy(Request $request, Workspace $workspace, Board $board, Task $task): Response
    {
        $this->authorize('delete', $task);

        $this->taskService->delete($task, $request->user());

        return response()->noContent();
    }
}
