<?php

namespace Database\Factories;

use App\Models\Workspace;
use Illuminate\Database\Eloquent\Factories\Factory;

class BoardFactory extends Factory
{
    public function definition(): array
    {
        return [
            'workspace_id' => Workspace::factory(),
            'name' => $this->faker->words(3, true),
            'description' => $this->faker->optional()->sentence(),
        ];
    }
}
