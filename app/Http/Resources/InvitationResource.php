<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class InvitationResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'workspace_id' => $this->workspace_id,
            'email' => $this->email,
            'role' => $this->role,
            'accepted_at' => $this->accepted_at,
            'expires_at' => $this->expires_at,
            'inviter' => new UserResource($this->whenLoaded('inviter')),
            'created_at' => $this->created_at,
        ];
    }
}
