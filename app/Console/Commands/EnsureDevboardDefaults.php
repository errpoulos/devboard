<?php

namespace App\Console\Commands;

use App\Models\Board;
use App\Models\BoardColumn;
use App\Models\User;
use App\Models\Workspace;
use Illuminate\Console\Command;

class EnsureDevboardDefaults extends Command
{
    protected $signature = 'app:ensure-devboard-defaults';

    protected $description = 'Create the default workspace, Bug Reports board, and Feature Requests board if they do not exist.';

    public function handle(): int
    {
        $owner = User::where('is_super_admin', true)->first();
        if (! $owner) {
            $this->error('No super-admin user found. Run seeders first.');

            return 1;
        }

        $workspace = Workspace::firstOrCreate(
            ['is_default' => true],
            [
                'name' => 'DevBoard HQ',
                'slug' => 'devboard-hq',
                'owner_id' => $owner->id,
                'organization_id' => $owner->organization_id,
            ]
        );
        $this->info("Workspace: {$workspace->name} (id={$workspace->id})");

        $workspace->members()->syncWithoutDetaching([$owner->id => ['role' => 'owner']]);

        $this->ensureBoard($workspace, 'Bug Reports', ['Backlog', 'In Progress', 'Fixed', 'Closed']);
        $this->ensureBoard($workspace, 'Feature Requests', ['Backlog', 'Under Review', 'In Progress', 'Released']);

        $this->info('Done.');

        return 0;
    }

    private function ensureBoard(Workspace $workspace, string $name, array $columns): void
    {
        $board = Board::firstOrCreate(
            ['workspace_id' => $workspace->id, 'name' => $name],
            ['description' => null]
        );
        $this->info("  Board: {$board->name} (id={$board->id})");

        foreach ($columns as $pos => $colName) {
            BoardColumn::firstOrCreate(
                ['board_id' => $board->id, 'name' => $colName],
                ['position' => $pos]
            );
        }
    }
}
