<?php

namespace App\Http\Controllers\Api\V1;

use App\DTOs\StoreWorkspaceDTO;
use App\DTOs\UpdateWorkspaceDTO;
use App\Http\Controllers\Controller;
use App\Http\Requests\StoreWorkspaceRequest;
use App\Http\Requests\UpdateWorkspaceRequest;
use App\Http\Resources\WorkspaceResource;
use App\Models\Workspace;
use App\Services\WorkspaceService;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\ResourceCollection;

class WorkspaceController extends Controller
{
    public function __construct(private readonly WorkspaceService $workspaceService) {}

    public function index(Request $request): ResourceCollection
    {
        $workspaces = $request->user()->workspaces()->withCount('members')->get();

        return WorkspaceResource::collection($workspaces);
    }

    public function store(StoreWorkspaceRequest $request): WorkspaceResource
    {
        $workspace = $this->workspaceService->create(
            data: StoreWorkspaceDTO::fromRequest($request),
            owner: $request->user(),
        );

        return new WorkspaceResource($workspace);
    }

    public function update(UpdateWorkspaceRequest $request, Workspace $workspace): WorkspaceResource
    {
        $this->authorize('update', $workspace);

        $workspace = $this->workspaceService->update(
            workspace: $workspace,
            data: UpdateWorkspaceDTO::fromRequest($request),
        );

        return new WorkspaceResource($workspace);
    }

    public function show(Workspace $workspace): WorkspaceResource
    {
        $this->authorize('view', $workspace);

        return new WorkspaceResource($workspace->load('owner')->loadCount('members'));
    }

    public function destroy(Workspace $workspace): \Illuminate\Http\Response
    {
        $this->authorize('delete', $workspace);

        $workspace->delete();

        return response()->noContent();
    }
}
