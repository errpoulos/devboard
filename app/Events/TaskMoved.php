<?php

namespace App\Events;

use App\Models\Task;
use App\Models\User;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class TaskMoved implements ShouldBroadcast
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public function __construct(
        public readonly Task $task,
        public readonly User $actor,
        public readonly int $fromColumnId,
        public readonly int $toColumnId,
    ) {}

    public function broadcastOn(): array
    {
        return [
            new PrivateChannel('workspace.'.$this->task->workspace_id),
        ];
    }

    public function broadcastWith(): array
    {
        return [
            'task_id' => $this->task->id,
            'from_column_id' => $this->fromColumnId,
            'to_column_id' => $this->toColumnId,
            'position' => $this->task->position,
        ];
    }
}
