<?php

namespace App\Policies;

use App\Models\User;
use App\Models\Workspace;

class WorkspacePolicy
{
    public function view(User $user, Workspace $workspace): bool
    {
        return $workspace->members()->where('user_id', $user->id)->exists();
    }

    public function update(User $user, Workspace $workspace): bool
    {
        return $this->isMemberWithRole($user, $workspace, ['owner', 'admin']);
    }

    public function delete(User $user, Workspace $workspace): bool
    {
        return $workspace->owner_id === $user->id;
    }

    public function inviteMembers(User $user, Workspace $workspace): bool
    {
        return $this->isMemberWithRole($user, $workspace, ['owner', 'admin']);
    }

    public function removeMembers(User $user, Workspace $workspace): bool
    {
        return $this->isMemberWithRole($user, $workspace, ['owner', 'admin']);
    }

    private function isMemberWithRole(User $user, Workspace $workspace, array $roles): bool
    {
        return $workspace->members()
            ->where('user_id', $user->id)
            ->wherePivotIn('role', $roles)
            ->exists();
    }
}
