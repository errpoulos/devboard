<?php

namespace App\Services;

use App\Models\Devboard\DevboardBoard;
use App\Models\Devboard\DevboardBoardColumn;
use App\Models\Devboard\DevboardComment;
use App\Models\Devboard\DevboardTask;
use App\Models\Devboard\DevboardWorkspace;
use App\Models\Ticket;
use Illuminate\Support\Collection;

class DevboardBridge
{
    public function createTask(Ticket $ticket): ?int
    {
        $workspace = DevboardWorkspace::where('is_default', true)->first();
        if (! $workspace) {
            return null;
        }

        $boardName = $ticket->type === 'bug_report' ? 'Bug Reports' : 'Feature Requests';
        $board = DevboardBoard::where('workspace_id', $workspace->id)
            ->where('name', $boardName)
            ->first();
        if (! $board) {
            return null;
        }

        $column = DevboardBoardColumn::where('board_id', $board->id)
            ->orderBy('position')
            ->first();
        if (! $column) {
            return null;
        }

        $maxPosition = DevboardTask::where('board_column_id', $column->id)->max('position') ?? 0;

        $task = DevboardTask::create([
            'workspace_id' => $workspace->id,
            'board_column_id' => $column->id,
            'title' => $ticket->subject,
            'description' => $ticket->description,
            'priority' => $ticket->priority ?? 'medium',
            'position' => $maxPosition + 1,
            'helpdesk_ticket_id' => $ticket->id,
        ]);

        return $task->id;
    }

    public function getTaskStatus(int $taskId): ?array
    {
        $task = DevboardTask::with('column')->find($taskId);
        if (! $task) {
            return null;
        }

        return [
            'task_id' => $task->id,
            'column' => $task->column?->name,
            'title' => $task->title,
        ];
    }

    public function getTaskComments(int $taskId): Collection
    {
        return DevboardComment::where('task_id', $taskId)
            ->with('author')
            ->orderBy('created_at')
            ->get();
    }
}
