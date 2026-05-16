<?php

namespace App\Events;

use App\Models\User;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class TaskDeleted implements ShouldBroadcast
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public function __construct(
        public readonly int $taskId,
        public readonly int $workspaceId,
        public readonly User $actor,
    ) {}

    public function broadcastOn(): array
    {
        return [
            new PrivateChannel('workspace.'.$this->workspaceId),
        ];
    }

    public function broadcastWith(): array
    {
        return ['task_id' => $this->taskId];
    }
}
