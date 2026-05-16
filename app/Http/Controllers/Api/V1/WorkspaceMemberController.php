<?php

namespace App\Http\Controllers\Api\V1;

use App\DTOs\InviteMemberDTO;
use App\Http\Controllers\Controller;
use App\Http\Requests\InviteMemberRequest;
use App\Http\Resources\InvitationResource;
use App\Http\Resources\UserResource;
use App\Models\User;
use App\Models\Workspace;
use App\Services\WorkspaceService;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\ResourceCollection;
use Illuminate\Http\Response;

class WorkspaceMemberController extends Controller
{
    public function __construct(private readonly WorkspaceService $workspaceService) {}

    public function index(Workspace $workspace): ResourceCollection
    {
        $this->authorize('view', $workspace);

        return UserResource::collection($workspace->members);
    }

    public function invite(InviteMemberRequest $request, Workspace $workspace): InvitationResource
    {
        $this->authorize('inviteMembers', $workspace);

        $invitation = $this->workspaceService->invite(
            workspace: $workspace,
            data: InviteMemberDTO::fromRequest($request),
            inviter: $request->user(),
        );

        return new InvitationResource($invitation);
    }

    public function remove(Request $request, Workspace $workspace, User $member): Response
    {
        $this->authorize('removeMembers', $workspace);

        $this->workspaceService->removeMember($workspace, $member);

        return response()->noContent();
    }
}
