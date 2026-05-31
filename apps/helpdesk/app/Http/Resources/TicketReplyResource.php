<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class TicketReplyResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'body' => $this->body,
            'is_private' => $this->when(auth()->user()?->isAgent(), $this->is_private),
            'created_at' => $this->created_at?->toISOString(),
            'user' => $this->whenLoaded('user', fn () => new UserResource($this->user)),
        ];
    }
}
