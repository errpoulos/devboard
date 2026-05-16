<?php

namespace App\Http\Controllers\Api\V1;

use App\DTOs\StoreBoardDTO;
use App\Http\Controllers\Controller;
use App\Http\Requests\StoreBoardRequest;
use App\Http\Resources\BoardResource;
use App\Models\Board;
use App\Models\Workspace;
use App\Services\BoardService;
use Illuminate\Http\Resources\Json\ResourceCollection;
use Illuminate\Http\Response;

class BoardController extends Controller
{
    public function __construct(private readonly BoardService $boardService) {}

    public function index(Workspace $workspace): ResourceCollection
    {
        $boards = Board::all();

        return BoardResource::collection($boards);
    }

    public function store(StoreBoardRequest $request, Workspace $workspace): BoardResource
    {
        $this->authorize('create', Board::class);

        $board = $this->boardService->create(
            workspace: $workspace,
            data: StoreBoardDTO::fromRequest($request),
        );

        return new BoardResource($board);
    }

    public function show(Workspace $workspace, Board $board): BoardResource
    {
        $this->authorize('view', $board);

        return new BoardResource(
            $board->load(['columns.tasks.assignee'])
        );
    }

    public function destroy(Workspace $workspace, Board $board): Response
    {
        $this->authorize('delete', $board);

        $board->delete();

        return response()->noContent();
    }
}
