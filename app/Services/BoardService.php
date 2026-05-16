<?php

namespace App\Services;

use App\DTOs\StoreBoardDTO;
use App\Models\Board;
use App\Models\BoardColumn;
use App\Models\Workspace;

class BoardService
{
    public function create(Workspace $workspace, StoreBoardDTO $data): Board
    {
        $board = Board::create([
            'workspace_id' => $workspace->id,
            'name' => $data->name,
            'description' => $data->description,
        ]);

        $this->createDefaultColumns($board);

        return $board->load('columns');
    }

    public function reorderColumns(Board $board, array $orderedIds): void
    {
        foreach ($orderedIds as $position => $columnId) {
            BoardColumn::where('id', $columnId)
                ->where('board_id', $board->id)
                ->update(['position' => $position]);
        }
    }

    private function createDefaultColumns(Board $board): void
    {
        $defaults = [
            ['name' => 'To Do', 'color' => '#6b7280', 'position' => 0],
            ['name' => 'In Progress', 'color' => '#3b82f6', 'position' => 1],
            ['name' => 'Done', 'color' => '#22c55e', 'position' => 2],
        ];

        foreach ($defaults as $column) {
            $board->columns()->create($column);
        }
    }
}
