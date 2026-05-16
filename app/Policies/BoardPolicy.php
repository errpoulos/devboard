<?php

namespace App\Policies;

use App\Models\Board;
use App\Models\User;

class BoardPolicy
{
    public function view(User $user, Board $board): bool
    {
        return $board->workspace->members()->where('user_id', $user->id)->exists();
    }

    public function create(User $user): bool
    {
        return true; // workspace membership checked by SetCurrentWorkspace middleware
    }

    public function update(User $user, Board $board): bool
    {
        return $board->workspace->members()
            ->where('user_id', $user->id)
            ->wherePivotIn('role', ['owner', 'admin'])
            ->exists();
    }

    public function delete(User $user, Board $board): bool
    {
        return $this->update($user, $board);
    }
}
