<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\ReorderRequest;
use App\Models\Board;
use App\Models\Workspace;
use App\Services\TaskService;
use Illuminate\Http\Response;

class TaskReorderController extends Controller
{
    public function __construct(private readonly TaskService $taskService) {}

    public function __invoke(ReorderRequest $request, Workspace $workspace, Board $board): Response
    {
        $this->authorize('update', $board);

        $this->taskService->reorder(
            board: $board,
            columnId: $request->validated('column_id'),
            orderedIds: $request->validated('ordered_ids'),
        );

        return response()->noContent();
    }
}
