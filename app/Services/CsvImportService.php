<?php

namespace App\Services;

use App\DTOs\StoreBoardDTO;
use App\DTOs\StoreTaskDTO;
use App\Models\Board;
use App\Models\User;
use App\Models\Workspace;
use Illuminate\Http\UploadedFile;

class CsvImportService
{
    public function __construct(
        private readonly BoardService $boardService,
        private readonly TaskService $taskService,
    ) {}

    /**
     * Import boards from a CSV file.
     * Expected columns: name (required), description (optional)
     */
    public function importBoards(Workspace $workspace, UploadedFile $file, User $actor): array
    {
        [$headers, $rows, $parseError] = $this->parseCsv($file);

        if ($parseError) {
            return ['created' => 0, 'failed' => 0, 'errors' => [['row' => 0, 'message' => $parseError]]];
        }

        $nameIdx = $this->headerIndex($headers, 'name');
        $descIdx = $this->headerIndex($headers, 'description');

        if ($nameIdx === null) {
            return ['created' => 0, 'failed' => 0, 'errors' => [['row' => 0, 'message' => 'CSV must include a "name" column']]];
        }

        $created = 0;
        $errors = [];

        foreach ($rows as $i => $row) {
            $rowNum = $i + 2;
            $name = trim($row[$nameIdx] ?? '');

            if ($name === '') {
                $errors[] = ['row' => $rowNum, 'message' => 'Name is required'];
                continue;
            }

            try {
                $this->boardService->create(
                    workspace: $workspace,
                    data: new StoreBoardDTO(
                        name: $name,
                        description: $descIdx !== null ? (trim($row[$descIdx] ?? '') ?: null) : null,
                    ),
                );
                $created++;
            } catch (\Throwable $e) {
                $errors[] = ['row' => $rowNum, 'message' => $e->getMessage()];
            }
        }

        return ['created' => $created, 'failed' => count($errors), 'errors' => $errors];
    }

    /**
     * Import tasks from a CSV file.
     * Expected columns: title (required), description, priority, story_points, due_date, status
     * "status" maps to a column name; unrecognised values fall back to the first column.
     */
    public function importTasks(Board $board, UploadedFile $file, User $actor): array
    {
        [$headers, $rows, $parseError] = $this->parseCsv($file);

        if ($parseError) {
            return ['created' => 0, 'failed' => 0, 'errors' => [['row' => 0, 'message' => $parseError]]];
        }

        $titleIdx   = $this->headerIndex($headers, 'title');
        $descIdx    = $this->headerIndex($headers, 'description');
        $prioIdx    = $this->headerIndex($headers, 'priority');
        $spIdx      = $this->headerIndex($headers, 'story_points');
        $dueIdx     = $this->headerIndex($headers, 'due_date');
        $statusIdx  = $this->headerIndex($headers, 'status');

        if ($titleIdx === null) {
            return ['created' => 0, 'failed' => 0, 'errors' => [['row' => 0, 'message' => 'CSV must include a "title" column']]];
        }

        // Build column lookup: lowercase name → id
        $columns = $board->columns()->orderBy('position')->get();
        $firstColumnId = $columns->first()?->id;

        if (!$firstColumnId) {
            return ['created' => 0, 'failed' => 0, 'errors' => [['row' => 0, 'message' => 'Board has no columns']]];
        }

        $columnMap = $columns->mapWithKeys(fn ($c) => [strtolower($c->name) => $c->id])->all();

        $validPriorities = ['low', 'medium', 'high', 'urgent'];
        $created = 0;
        $errors = [];

        foreach ($rows as $i => $row) {
            $rowNum = $i + 2;
            $title = trim($row[$titleIdx] ?? '');

            if ($title === '') {
                $errors[] = ['row' => $rowNum, 'message' => 'Title is required'];
                continue;
            }

            $priorityRaw = strtolower(trim($row[$prioIdx] ?? ''));
            $priority = in_array($priorityRaw, $validPriorities) ? $priorityRaw : 'medium';

            $statusRaw = strtolower(trim($row[$statusIdx] ?? ''));
            $columnId = $statusRaw !== '' ? ($columnMap[$statusRaw] ?? $firstColumnId) : $firstColumnId;

            $spRaw = trim($row[$spIdx] ?? '');
            $storyPoints = $spRaw !== '' && is_numeric($spRaw) ? (int) $spRaw : null;

            $dueDateRaw = trim($row[$dueIdx] ?? '');
            $dueAt = null;
            if ($dueDateRaw !== '') {
                try {
                    $dueAt = (new \DateTime($dueDateRaw))->format('Y-m-d');
                } catch (\Throwable) {
                    // silently ignore unparseable dates
                }
            }

            try {
                $task = $this->taskService->create(
                    board: $board,
                    data: new StoreTaskDTO(
                        title: $title,
                        description: $descIdx !== null ? (trim($row[$descIdx] ?? '') ?: null) : null,
                        assigneeId: null,
                        boardColumnId: $columnId,
                        priority: $priority,
                        dueAt: $dueAt,
                        storyPoints: $storyPoints,
                    ),
                    actor: $actor,
                );
                $created++;
            } catch (\Throwable $e) {
                $errors[] = ['row' => $rowNum, 'message' => $e->getMessage()];
            }
        }

        return ['created' => $created, 'failed' => count($errors), 'errors' => $errors];
    }

    // ─────────────────────────────────────────────────────────────
    // Helpers
    // ─────────────────────────────────────────────────────────────

    /** Returns [headers[], rows[][], errorMessage|null] */
    private function parseCsv(UploadedFile $file): array
    {
        $content = file_get_contents($file->getRealPath());

        if ($content === false || trim($content) === '') {
            return [[], [], 'File is empty'];
        }

        // Normalise line endings
        $content = str_replace(["\r\n", "\r"], "\n", $content);
        $lines = array_filter(explode("\n", $content), fn ($l) => trim($l) !== '');
        $lines = array_values($lines);

        if (count($lines) < 2) {
            return [[], [], 'CSV must have a header row and at least one data row'];
        }

        $headers = array_map(fn ($h) => strtolower(trim($h)), str_getcsv($lines[0]));
        $rows = array_map(fn ($l) => str_getcsv($l), array_slice($lines, 1));

        return [$headers, $rows, null];
    }

    private function headerIndex(array $headers, string $name): ?int
    {
        $idx = array_search($name, $headers);
        return $idx !== false ? $idx : null;
    }
}
