<?php

use App\Models\Board;
use App\Models\Workspace;
use Illuminate\Support\Facades\Broadcast;

Broadcast::channel('App.Models.User.{id}', function ($user, $id) {
    return (int) $user->id === (int) $id;
});

Broadcast::channel('workspace.{workspaceId}', function ($user, int $workspaceId) {
    return Workspace::find($workspaceId)?->members()->where('user_id', $user->id)->exists();
});

Broadcast::channel('presence-board.{boardId}', function ($user, int $boardId) {
    $board = Board::find($boardId);

    if (! $board) {
        return false;
    }

    $isMember = $board->workspace->members()->where('user_id', $user->id)->exists();

    return $isMember ? ['id' => $user->id, 'name' => $user->name] : false;
});
