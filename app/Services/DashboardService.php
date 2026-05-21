<?php

namespace App\Services;

use App\Models\Workspace;
use Illuminate\Support\Facades\DB;

class DashboardService
{
    public function metrics(Workspace $workspace, ?int $boardId = null): array
    {
        $tasksByStatus = DB::table('board_columns')
            ->join('boards', 'board_columns.board_id', '=', 'boards.id')
            ->leftJoin('tasks', 'tasks.board_column_id', '=', 'board_columns.id')
            ->where('boards.workspace_id', $workspace->id)
            ->when($boardId, fn ($q) => $q->where('boards.id', $boardId))
            ->select(
                'board_columns.name',
                DB::raw('MIN(board_columns.color) as color'),
                DB::raw('MIN(board_columns.position) as position'),
                DB::raw('COUNT(tasks.id) as count'),
            )
            ->groupBy('board_columns.name')
            ->orderBy(DB::raw('MIN(board_columns.position)'))
            ->get()
            ->map(fn ($row) => [
                'column' => $row->name,
                'color' => $row->color,
                'count' => (int) $row->count,
            ]);

        $avgTimePerStatus = DB::table('board_columns')
            ->join('boards', 'board_columns.board_id', '=', 'boards.id')
            ->join('task_status_logs', 'task_status_logs.board_column_id', '=', 'board_columns.id')
            ->where('boards.workspace_id', $workspace->id)
            ->when($boardId, fn ($q) => $q->where('boards.id', $boardId))
            ->select(
                'board_columns.name',
                DB::raw('MIN(board_columns.color) as color'),
                DB::raw('MIN(board_columns.position) as position'),
                DB::raw('AVG(TIMESTAMPDIFF(SECOND, task_status_logs.entered_at, COALESCE(task_status_logs.exited_at, NOW()))) / 3600 as avg_hours'),
            )
            ->groupBy('board_columns.name')
            ->orderBy(DB::raw('MIN(board_columns.position)'))
            ->get()
            ->map(fn ($row) => [
                'column' => $row->name,
                'color' => $row->color,
                'avg_hours' => round((float) $row->avg_hours, 1),
            ]);

        return [
            'workspace_id' => $workspace->id,
            'tasks_by_status' => $tasksByStatus,
            'avg_time_per_status' => $avgTimePerStatus,
        ];
    }
}
