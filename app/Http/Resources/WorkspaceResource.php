<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class WorkspaceResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'name' => $this->name,
            'slug' => $this->slug,
            'owner' => new UserResource($this->whenLoaded('owner')),
            'members_count' => $this->whenCounted('members'),
            'created_at' => $this->created_at,
        ];
    }
}
