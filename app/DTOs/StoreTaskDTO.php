<?php

namespace App\DTOs;

use App\Http\Requests\StoreTaskRequest;

readonly class StoreTaskDTO
{
    public function __construct(
        public string $title,
        public ?string $description,
        public ?int $assigneeId,
        public int $boardColumnId,
        public string $priority,
        public ?string $dueAt,
        public ?int $storyPoints,
    ) {}

    public static function fromRequest(StoreTaskRequest $request): self
    {
        return new self(
            title: $request->validated('title'),
            description: $request->validated('description'),
            assigneeId: $request->validated('assignee_id'),
            boardColumnId: $request->validated('board_column_id'),
            priority: $request->validated('priority', 'medium'),
            dueAt: $request->validated('due_at'),
            storyPoints: $request->validated('story_points'),
        );
    }
}
