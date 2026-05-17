<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\Board;
use App\Models\Workspace;
use App\Services\CsvImportService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class TaskImportController extends Controller
{
    public function __construct(private readonly CsvImportService $importService) {}

    public function store(Request $request, Workspace $workspace, Board $board): JsonResponse
    {
        $this->authorize('update', $board);

        $request->validate([
            'file' => ['required', 'file', 'mimes:csv,txt', 'max:2048'],
        ]);

        $result = $this->importService->importTasks(
            board: $board,
            file: $request->file('file'),
            actor: $request->user(),
        );

        return response()->json(['data' => $result]);
    }
}
