<?php

namespace Database\Seeders;

use App\Models\Board;
use App\Models\BoardColumn;
use App\Models\Task;
use App\Models\TaskStatusLog;
use App\Models\User;
use App\Models\Workspace;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    use WithoutModelEvents;

    public function run(): void
    {
        $admin = User::factory()->create([
            'name' => 'Admin User',
            'email' => 'admin@devboard.test',
        ]);

        $members = User::factory(4)->create();

        $workspace = Workspace::create([
            'name' => 'Dev Team',
            'slug' => 'dev-team',
            'owner_id' => $admin->id,
        ]);

        $workspace->members()->attach($admin->id, ['role' => 'owner']);
        foreach ($members as $member) {
            $workspace->members()->attach($member->id, ['role' => 'member']);
        }

        $board = Board::create([
            'workspace_id' => $workspace->id,
            'name' => 'Sprint 1',
            'description' => 'First sprint board',
        ]);

        $columns = collect([
            ['name' => 'To Do', 'color' => '#6b7280', 'position' => 0],
            ['name' => 'In Progress', 'color' => '#3b82f6', 'position' => 1],
            ['name' => 'Review', 'color' => '#f59e0b', 'position' => 2],
            ['name' => 'Done', 'color' => '#22c55e', 'position' => 3],
        ])->map(fn ($col) => $board->columns()->create($col));

        $allUsers = $members->push($admin);

        // Avg hours tasks realistically spend in each status
        $avgHours = ['To Do' => [24, 96], 'In Progress' => [4, 32], 'Review' => [2, 16], 'Done' => [1, 8]];

        foreach ($columns as $column) {
            $tasks = Task::factory(5)->create([
                'workspace_id' => $workspace->id,
                'board_column_id' => $column->id,
                'assignee_id' => $allUsers->random()->id,
            ]);

            [$minH, $maxH] = $avgHours[$column->name];

            foreach ($tasks as $task) {
                $enteredAt = now()->subHours(rand($minH, $maxH));
                $exitedAt = $column->name === 'Done' ? $enteredAt->copy()->addHours(rand(1, 6)) : null;

                TaskStatusLog::create([
                    'task_id' => $task->id,
                    'board_column_id' => $column->id,
                    'entered_at' => $enteredAt,
                    'exited_at' => $exitedAt,
                ]);
            }
        }
    }
}
