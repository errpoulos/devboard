<?php

namespace App\Http\Resources;

use App\Models\ClientNote;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class TicketResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'subject' => $this->subject,
            'description' => $this->description,
            'status' => $this->status,
            'priority' => $this->priority,
            'type' => $this->type,
            'assigned_to' => $this->when($this->assignee, fn () => new UserResource($this->assignee)),
            'devboard_task_id' => $this->devboard_task_id,
            'created_at' => $this->created_at?->toISOString(),
            'user' => $this->whenLoaded('user', fn () => new UserResource($this->user)),
            'replies_count' => $this->whenCounted('replies'),
            'customer_notes' => $this->when(
                auth()->user()?->isAgent(),
                fn () => ClientNoteResource::collection(
                    ClientNote::where('subject_user_id', $this->user_id)->with('author')->orderBy('created_at')->get()
                )
            ),
            'org_notes' => $this->when(
                auth()->user()?->isAgent(),
                fn () => ClientNoteResource::collection(
                    ClientNote::where('organization_id', $this->organization_id)->whereNull('subject_user_id')->with('author')->orderBy('created_at')->get()
                )
            ),
            'attachments' => TicketAttachmentResource::collection($this->whenLoaded('attachments')),
            'devboard_task' => $this->when(
                $this->devboard_task_id && auth()->user()?->isAgent(),
                function () {
                    $bridge = app(\App\Services\DevboardBridge::class);
                    $status = $bridge->getTaskStatus($this->devboard_task_id);
                    $comments = $bridge->getTaskComments($this->devboard_task_id);

                    return [
                        'task_id' => $status['task_id'] ?? null,
                        'column' => $status['column'] ?? null,
                        'comments' => $comments->map(fn ($c) => [
                            'id' => $c->id,
                            'body' => $c->body,
                            'author' => $c->author?->name,
                            'created_at' => $c->created_at?->toISOString(),
                        ])->values(),
                    ];
                }
            ),
        ];
    }
}
