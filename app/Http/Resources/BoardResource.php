<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class BoardResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'workspace_id' => $this->workspace_id,
            'name' => $this->name,
            'description' => $this->description,
            'columns' => BoardColumnResource::collection($this->whenLoaded('columns')),
            'created_at' => $this->created_at,
        ];
    }
}
