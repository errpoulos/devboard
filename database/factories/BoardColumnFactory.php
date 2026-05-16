<?php

namespace Database\Factories;

use App\Models\Board;
use Illuminate\Database\Eloquent\Factories\Factory;

class BoardColumnFactory extends Factory
{
    public function definition(): array
    {
        return [
            'board_id' => Board::factory(),
            'name' => $this->faker->randomElement(['To Do', 'In Progress', 'Review', 'Done']),
            'position' => $this->faker->numberBetween(0, 10),
            'color' => $this->faker->hexColor(),
        ];
    }
}
