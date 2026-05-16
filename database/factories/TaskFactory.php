<?php

namespace Database\Factories;

use App\Models\BoardColumn;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

class TaskFactory extends Factory
{
    public function definition(): array
    {
        $column = BoardColumn::factory()->create();

        return [
            'workspace_id' => $column->board->workspace_id,
            'board_column_id' => $column->id,
            'assignee_id' => $this->faker->optional()->passthrough(User::factory()),
            'title' => $this->faker->sentence(5),
            'description' => $this->faker->optional()->paragraph(),
            'priority' => $this->faker->randomElement(['low', 'medium', 'high', 'urgent']),
            'position' => $this->faker->numberBetween(0, 100),
            'due_at' => $this->faker->optional()->dateTimeBetween('now', '+30 days'),
            'completed_at' => null,
        ];
    }
}
