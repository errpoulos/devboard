<?php

namespace App\Policies;

use App\Models\Task;
use App\Models\User;

class TaskPolicy
{
    public function view(User $user, Task $task): bool
    {
        return $task->column->board->workspace->members()
            ->where('user_id', $user->id)
            ->exists();
    }

    public function create(User $user): bool
    {
        return true;
    }

    public function update(User $user, Task $task): bool
    {
        return $task->column->board->workspace->members()
            ->where('user_id', $user->id)
            ->exists();
    }

    public function delete(User $user, Task $task): bool
    {
        return $task->column->board->workspace->members()
            ->where('user_id', $user->id)
            ->wherePivotIn('role', ['owner', 'admin'])
            ->exists();
    }
}
