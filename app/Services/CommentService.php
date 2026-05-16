<?php

namespace App\Services;

use App\DTOs\StoreCommentDTO;
use App\Models\Comment;
use App\Models\Task;
use App\Models\User;

class CommentService
{
    public function create(Task $task, StoreCommentDTO $data, User $actor): Comment
    {
        return $task->comments()->create([
            'user_id' => $actor->id,
            'body' => $data->body,
        ]);
    }

    public function delete(Comment $comment): void
    {
        $comment->delete();
    }
}
