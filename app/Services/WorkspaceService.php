<?php

namespace App\Services;

use App\DTOs\InviteMemberDTO;
use App\DTOs\StoreWorkspaceDTO;
use App\DTOs\UpdateWorkspaceDTO;
use App\Events\MemberInvited;
use App\Models\Invitation;
use App\Models\User;
use App\Models\Workspace;
use Illuminate\Support\Str;

class WorkspaceService
{
    public function create(StoreWorkspaceDTO $data, User $owner): Workspace
    {
        $workspace = Workspace::create([
            'name' => $data->name,
            'slug' => $data->slug,
            'owner_id' => $owner->id,
        ]);

        $workspace->members()->attach($owner->id, ['role' => 'owner']);

        return $workspace;
    }

    public function update(Workspace $workspace, UpdateWorkspaceDTO $data): Workspace
    {
        $workspace->update(['name' => $data->name, 'slug' => $data->slug]);

        return $workspace;
    }

    public function invite(Workspace $workspace, InviteMemberDTO $data, User $inviter): Invitation
    {
        $invitation = Invitation::create([
            'workspace_id' => $workspace->id,
            'inviter_id' => $inviter->id,
            'email' => $data->email,
            'role' => $data->role,
            'token' => Str::random(64),
            'expires_at' => now()->addDays(7),
        ]);

        event(new MemberInvited($invitation));

        return $invitation;
    }

    public function acceptInvitation(Invitation $invitation, User $user): void
    {
        $invitation->update(['accepted_at' => now()]);

        $invitation->workspace->members()->syncWithoutDetaching([
            $user->id => ['role' => $invitation->role],
        ]);
    }

    public function removeMember(Workspace $workspace, User $member): void
    {
        $workspace->members()->detach($member->id);
    }
}
