<?php

namespace App\DTOs;

use App\Http\Requests\UpdateTaskRequest;

readonly class UpdateTaskDTO
{
    public function __construct(
        public ?string $title,
        public ?string $description,
        public ?int $assigneeId,
        public ?int $boardColumnId,
        public ?string $priority,
        public ?string $dueAt,
        public ?string $completedAt,
    ) {}

    public static function fromRequest(UpdateTaskRequest $request): self
    {
        return new self(
            title: $request->validated('title'),
            description: $request->validated('description'),
            assigneeId: $request->validated('assignee_id'),
            boardColumnId: $request->validated('board_column_id'),
            priority: $request->validated('priority'),
            dueAt: $request->validated('due_at'),
            completedAt: $request->validated('completed_at'),
        );
    }
}
