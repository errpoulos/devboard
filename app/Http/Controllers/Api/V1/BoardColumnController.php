<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\ReorderRequest;
use App\Models\Board;
use App\Models\Workspace;
use App\Services\BoardService;
use Illuminate\Http\Response;

class BoardColumnController extends Controller
{
    public function __construct(private readonly BoardService $boardService) {}

    public function reorder(ReorderRequest $request, Workspace $workspace, Board $board): Response
    {
        $this->authorize('update', $board);

        $this->boardService->reorderColumns($board, $request->validated('ordered_ids'));

        return response()->noContent();
    }
}
