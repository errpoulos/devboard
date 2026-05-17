<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\ReorderRequest;
use App\Http\Requests\StoreBoardColumnRequest;
use App\Http\Requests\UpdateBoardColumnRequest;
use App\Http\Resources\BoardColumnResource;
use App\Models\Board;
use App\Models\BoardColumn;
use App\Models\Workspace;
use App\Services\BoardService;
use Illuminate\Http\Response;

class BoardColumnController extends Controller
{
    public function __construct(private readonly BoardService $boardService) {}

    public function store(StoreBoardColumnRequest $request, Workspace $workspace, Board $board): BoardColumnResource
    {
        $this->authorize('update', $board);

        $column = $this->boardService->createColumn(
            board: $board,
            name: $request->validated('name'),
            color: $request->validated('color'),
        );

        return new BoardColumnResource($column);
    }

    public function update(UpdateBoardColumnRequest $request, Workspace $workspace, Board $board, BoardColumn $column): BoardColumnResource
    {
        $this->authorize('update', $board);

        $column = $this->boardService->updateColumn(
            column: $column,
            name: $request->validated('name', $column->name),
            color: $request->validated('color', $column->color),
        );

        return new BoardColumnResource($column);
    }

    public function destroy(Workspace $workspace, Board $board, BoardColumn $column): Response
    {
        $this->authorize('update', $board);

        $column->delete();

        return response()->noContent();
    }

    public function reorder(ReorderRequest $request, Workspace $workspace, Board $board): Response
    {
        $this->authorize('update', $board);

        $this->boardService->reorderColumns($board, $request->validated('ordered_ids'));

        return response()->noContent();
    }
}
