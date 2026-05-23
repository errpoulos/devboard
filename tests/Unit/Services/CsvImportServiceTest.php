<?php

use App\Models\User;
use App\Models\Workspace;
use App\Services\BoardService;
use App\Services\CsvImportService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;

uses(RefreshDatabase::class);

function makeCsvFile(string $content, string $name = 'import.csv'): UploadedFile
{
    $path = sys_get_temp_dir().'/'.uniqid().'_'.$name;
    file_put_contents($path, $content);

    return new UploadedFile($path, $name, 'text/csv', null, true);
}

beforeEach(function () {
    $this->user = User::factory()->create();

    $this->workspace = Workspace::factory()->create(['owner_id' => $this->user->id]);
    $this->workspace->members()->attach($this->user->id, ['role' => 'owner']);

    app()->instance('current.workspace', $this->workspace);

    $this->service = app(CsvImportService::class);
});

// ─── importBoards ─────────────────────────────────────────────────────────────

it('imports boards from a valid CSV', function () {
    $csv = "name,description\nAlpha Board,First board\nBeta Board,";
    $result = $this->service->importBoards(
        $this->workspace,
        makeCsvFile($csv),
        $this->user,
    );

    expect($result['created'])->toBe(2)
        ->and($result['failed'])->toBe(0)
        ->and($result['errors'])->toBeEmpty();

    $this->assertDatabaseHas('boards', ['workspace_id' => $this->workspace->id, 'name' => 'Alpha Board']);
    $this->assertDatabaseHas('boards', ['workspace_id' => $this->workspace->id, 'name' => 'Beta Board']);
});

it('returns an error when the name column is missing', function () {
    $csv = "title,description\nOops,";
    $result = $this->service->importBoards(
        $this->workspace,
        makeCsvFile($csv),
        $this->user,
    );

    expect($result['created'])->toBe(0)
        ->and($result['errors'][0]['row'])->toBe(0)
        ->and($result['errors'][0]['message'])->toContain('"name"');
});

it('skips rows with empty board names and counts them as failures', function () {
    // Use a row with an empty name column but non-empty description so the line is not filtered
    $csv = "name,description\nGood Board,first\n,has no name\nAnother Good,third";
    $result = $this->service->importBoards(
        $this->workspace,
        makeCsvFile($csv),
        $this->user,
    );

    expect($result['created'])->toBe(2)
        ->and($result['failed'])->toBe(1);
});

it('returns an error for empty CSV files', function () {
    $result = $this->service->importBoards(
        $this->workspace,
        makeCsvFile(''),
        $this->user,
    );

    expect($result['created'])->toBe(0)
        ->and($result['errors'][0]['message'])->toContain('empty');
});

// ─── importTasks ──────────────────────────────────────────────────────────────

beforeEach(function () {
    $this->board = app(BoardService::class)->create(
        workspace: $this->workspace,
        data: new \App\DTOs\StoreBoardDTO('Sprint 1', null),
    );
});

it('imports tasks from a valid CSV', function () {
    $csv = "title,priority,story_points\nFix bug,high,3\nWrite docs,low,";
    $result = $this->service->importTasks(
        $this->board,
        makeCsvFile($csv),
        $this->user,
    );

    expect($result['created'])->toBe(2)
        ->and($result['failed'])->toBe(0);

    $this->assertDatabaseHas('tasks', ['title' => 'Fix bug', 'priority' => 'high', 'story_points' => 3]);
    $this->assertDatabaseHas('tasks', ['title' => 'Write docs', 'priority' => 'low', 'story_points' => null]);
});

it('maps the status column to the correct board column', function () {
    $columns = $this->board->columns->keyBy('name');

    $csv = "title,status\nTask A,In Progress\nTask B,Done\nTask C,Unknown Status";
    $result = $this->service->importTasks(
        $this->board,
        makeCsvFile($csv),
        $this->user,
    );

    expect($result['created'])->toBe(3);

    $this->assertDatabaseHas('tasks', [
        'title' => 'Task A',
        'board_column_id' => $columns['In Progress']->id,
    ]);
    $this->assertDatabaseHas('tasks', [
        'title' => 'Task B',
        'board_column_id' => $columns['Done']->id,
    ]);
    // Unknown status falls back to first column (To Do)
    $this->assertDatabaseHas('tasks', [
        'title' => 'Task C',
        'board_column_id' => $columns['To Do']->id,
    ]);
});

it('falls back to medium priority for invalid priority values', function () {
    $csv = "title,priority\nTask,extreme";
    $this->service->importTasks($this->board, makeCsvFile($csv), $this->user);

    $this->assertDatabaseHas('tasks', ['title' => 'Task', 'priority' => 'medium']);
});

it('parses due dates and ignores unparseable values', function () {
    $csv = "title,due_date\nTask A,2026-12-01\nTask B,not-a-date";
    $this->service->importTasks($this->board, makeCsvFile($csv), $this->user);

    $this->assertDatabaseHas('tasks', ['title' => 'Task A', 'due_at' => '2026-12-01 00:00:00']);
    $this->assertDatabaseHas('tasks', ['title' => 'Task B', 'due_at' => null]);
});

it('skips rows with empty titles', function () {
    // Use a row with an empty title column but non-empty priority so the line is not filtered
    $csv = "title,priority\nReal Task,medium\n,high\nAnother Real,low";
    $result = $this->service->importTasks($this->board, makeCsvFile($csv), $this->user);

    expect($result['created'])->toBe(2)
        ->and($result['failed'])->toBe(1);
});

it('returns an error when the title column is missing', function () {
    $csv = "description\nsome text";
    $result = $this->service->importTasks($this->board, makeCsvFile($csv), $this->user);

    expect($result['created'])->toBe(0)
        ->and($result['errors'][0]['message'])->toContain('"title"');
});
