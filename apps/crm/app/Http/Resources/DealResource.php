<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class DealResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'title' => $this->title,
            'value' => $this->value,
            'status' => $this->status,
            'position' => $this->position,
            'stage_id' => $this->pipeline_stage_id,
            'contact' => $this->whenLoaded('contact', fn () => new ContactResource($this->contact)),
        ];
    }
}
