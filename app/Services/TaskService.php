<?php

namespace App\Services;

use App\DTOs\StoreTaskDTO;
use App\DTOs\UpdateTaskDTO;
use App\Events\TaskCreated;
use App\Events\TaskDeleted;
use App\Events\TaskMoved;
use App\Events\TaskUpdated;
use App\Models\Board;
use App\Models\Task;
use App\Models\TaskStatusLog;
use App\Models\User;

class TaskService
{
    public function create(Board $board, StoreTaskDTO $data, User $actor): Task
    {
        $position = Task::where('board_column_id', $data->boardColumnId)->max('position') + 1;

        $task = Task::create([
            'workspace_id' => $board->workspace_id,
            'board_column_id' => $data->boardColumnId,
            'assignee_id' => $data->assigneeId,
            'title' => $data->title,
            'description' => $data->description,
            'priority' => $data->priority,
            'position' => $position,
            'due_at' => $data->dueAt,
            'story_points' => $data->storyPoints,
        ]);

        TaskStatusLog::create([
            'task_id' => $task->id,
            'board_column_id' => $task->board_column_id,
            'entered_at' => now(),
        ]);

        event(new TaskCreated($task, $actor));

        return $task->load(['assignee', 'column']);
    }

    public function update(Task $task, UpdateTaskDTO $data, User $actor): Task
    {
        if ($data->boardColumnId && $data->boardColumnId !== $task->board_column_id) {
            $fromColumn = $task->board_column_id;

            TaskStatusLog::where('task_id', $task->id)
                ->whereNull('exited_at')
                ->update(['exited_at' => now()]);

            $task->update(['board_column_id' => $data->boardColumnId]);

            TaskStatusLog::create([
                'task_id' => $task->id,
                'board_column_id' => $data->boardColumnId,
                'entered_at' => now(),
            ]);

            event(new TaskMoved($task, $actor, $fromColumn, $data->boardColumnId));
        }

        // Build update data from only the keys explicitly sent in the request,
        // so null values clear a field rather than being silently ignored.
        $fieldMap = [
            'title' => $data->title,
            'description' => $data->description,
            'assignee_id' => $data->assigneeId,
            'priority' => $data->priority,
            'due_at' => $data->dueAt,
            'completed_at' => $data->completedAt,
            'story_points' => $data->storyPoints,
        ];

        $updateData = array_intersect_key($fieldMap, array_flip($data->keys));

        if (! empty($updateData)) {
            $task->update($updateData);
            event(new TaskUpdated($task, $actor, array_keys($updateData)));
        }

        return $task->fresh(['assignee', 'column']);
    }

    public function delete(Task $task, User $actor): void
    {
        $taskId = $task->id;
        $workspaceId = $task->workspace_id;

        $task->delete();

        event(new TaskDeleted($taskId, $workspaceId, $actor));
    }

    public function reorder(Board $board, int $columnId, array $orderedIds): void
    {
        foreach ($orderedIds as $position => $taskId) {
            Task::withoutGlobalScopes()
                ->where('id', $taskId)
                ->where('board_column_id', $columnId)
                ->update(['position' => $position]);
        }
    }
}
