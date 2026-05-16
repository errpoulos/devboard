<?php

namespace App\Policies;

use App\Models\Comment;
use App\Models\User;

class CommentPolicy
{
    public function delete(User $user, Comment $comment): bool
    {
        return $comment->user_id === $user->id
            || $comment->task->column->board->workspace->members()
                ->where('user_id', $user->id)
                ->wherePivotIn('role', ['owner', 'admin'])
                ->exists();
    }
}
