<?php

namespace App\DTOs;

use App\Http\Requests\UpdateTicketRequest;

readonly class UpdateTicketDTO
{
    public function __construct(
        public ?string $subject,
        public ?string $description,
        public ?string $status,
        public ?string $priority,
        public ?string $type,
        public ?int $assignedTo,
        public array $keys,
    ) {}

    public static function fromRequest(UpdateTicketRequest $request): self
    {
        $validated = $request->validated();

        return new self(
            subject: $validated['subject'] ?? null,
            description: $validated['description'] ?? null,
            status: $validated['status'] ?? null,
            priority: $validated['priority'] ?? null,
            type: $validated['type'] ?? null,
            assignedTo: isset($validated['assigned_to']) ? (int) $validated['assigned_to'] : null,
            keys: array_keys($validated),
        );
    }
}
