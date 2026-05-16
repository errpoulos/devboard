<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class BoardColumnResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'board_id' => $this->board_id,
            'name' => $this->name,
            'position' => $this->position,
            'color' => $this->color,
            'tasks' => TaskResource::collection($this->whenLoaded('tasks')),
        ];
    }
}
