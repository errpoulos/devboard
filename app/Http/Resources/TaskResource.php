<?php

namespace App\Http\Resources;

use App\Http\Resources\AttachmentResource;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class TaskResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'workspace_id' => $this->workspace_id,
            'board_column_id' => $this->board_column_id,
            'title' => $this->title,
            'description' => $this->description,
            'priority' => $this->priority,
            'story_points' => $this->story_points,
            'position' => $this->position,
            'due_at' => $this->due_at,
            'completed_at' => $this->completed_at,
            'helpdesk_ticket_id' => $this->helpdesk_ticket_id,
            'assignee' => new UserResource($this->whenLoaded('assignee')),
            'comments_count' => $this->whenCounted('comments'),
            'attachments_count' => $this->whenCounted('attachments'),
            'attachments' => AttachmentResource::collection($this->whenLoaded('attachments')),
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
        ];
    }
}
