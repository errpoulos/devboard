<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ClientNoteResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'category' => $this->category,
            'body' => $this->body,
            'created_at' => $this->created_at?->toISOString(),
            'author' => new UserResource($this->whenLoaded('author')),
        ];
    }
}
