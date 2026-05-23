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
            keys: array_keys($validated),
        );
    }
}
