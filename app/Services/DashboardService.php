<?php

namespace App\Services;

use App\Models\Workspace;
use Illuminate\Support\Facades\DB;

class DashboardService
{
    public function metrics(Workspace $workspace): array
    {
        $tasksByStatus = DB::table('board_columns')
            ->join('boards', 'board_columns.board_id', '=', 'boards.id')
            ->leftJoin('tasks', 'tasks.board_column_id', '=', 'board_columns.id')
            ->where('boards.workspace_id', $workspace->id)
            ->select(
                'board_columns.id',
                'board_columns.name',
                'board_columns.color',
                'board_columns.position',
                DB::raw('COUNT(tasks.id) as count'),
            )
            ->groupBy('board_columns.id', 'board_columns.name', 'board_columns.color', 'board_columns.position')
            ->orderBy('board_columns.position')
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
            ->select(
                'board_columns.id',
                'board_columns.name',
                'board_columns.color',
                'board_columns.position',
                DB::raw('AVG(TIMESTAMPDIFF(SECOND, task_status_logs.entered_at, COALESCE(task_status_logs.exited_at, NOW()))) / 3600 as avg_hours'),
            )
            ->groupBy('board_columns.id', 'board_columns.name', 'board_columns.color', 'board_columns.position')
            ->orderBy('board_columns.position')
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
