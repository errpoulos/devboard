<?php

namespace App\Listeners;

use App\Events\TaskCreated;
use App\Events\TaskDeleted;
use App\Events\TaskMoved;
use App\Events\TaskUpdated;
use App\Models\ActivityLog;
use Illuminate\Contracts\Queue\ShouldQueue;

class LogTaskActivity implements ShouldQueue
{
    public string $queue = 'default';

    public function handleTaskCreated(TaskCreated $event): void
    {
        ActivityLog::create([
            'user_id' => $event->actor->id,
            'workspace_id' => $event->task->workspace_id,
            'subject_type' => $event->task::class,
            'subject_id' => $event->task->id,
            'action' => 'created',
        ]);
    }

    public function handleTaskUpdated(TaskUpdated $event): void
    {
        ActivityLog::create([
            'user_id' => $event->actor->id,
            'workspace_id' => $event->task->workspace_id,
            'subject_type' => $event->task::class,
            'subject_id' => $event->task->id,
            'action' => 'updated',
            'properties' => $event->changes,
        ]);
    }

    public function handleTaskMoved(TaskMoved $event): void
    {
        ActivityLog::create([
            'user_id' => $event->actor->id,
            'workspace_id' => $event->task->workspace_id,
            'subject_type' => $event->task::class,
            'subject_id' => $event->task->id,
            'action' => 'moved',
            'properties' => [
                'from_column_id' => $event->fromColumnId,
                'to_column_id' => $event->toColumnId,
            ],
        ]);
    }

    public function handleTaskDeleted(TaskDeleted $event): void
    {
        ActivityLog::create([
            'user_id' => $event->actor->id,
            'workspace_id' => $event->workspaceId,
            'subject_type' => \App\Models\Task::class,
            'subject_id' => $event->taskId,
            'action' => 'deleted',
        ]);
    }
}
