<?php

namespace App\DTOs;

use App\Http\Requests\StoreTicketRequest;

readonly class StoreTicketDTO
{
    public function __construct(
        public string $subject,
        public string $description,
        public string $priority,
    ) {}

    public static function fromRequest(StoreTicketRequest $request): self
    {
        return new self(
            subject: $request->validated('subject'),
            description: $request->validated('description'),
            priority: $request->validated('priority', 'medium'),
        );
    }
}
