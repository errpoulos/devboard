<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class UserResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        $isCustomer = ! in_array($this->role, ['agent', 'administrator']);

        return [
            'id' => $this->id,
            'name' => $this->name,
            'email' => $this->email,
            'role' => $this->role,
            'is_admin' => (bool) ($this->role === 'administrator'),
            'tickets_count' => $this->whenCounted('tickets'),
            'organizations' => $this->when(
                $isCustomer && $this->relationLoaded('organizations'),
                fn () => $this->organizations->map(fn ($org) => [
                    'id' => $org->id,
                    'name' => $org->name,
                    'slug' => $org->slug,
                ])->values(),
            ),
        ];
    }
}
