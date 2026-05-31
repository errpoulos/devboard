<?php

namespace App\DTOs;

use App\Http\Requests\StoreTicketReplyRequest;

readonly class StoreTicketReplyDTO
{
    public function __construct(
        public string $body,
        public bool $isPrivate = false,
    ) {}

    public static function fromRequest(StoreTicketReplyRequest $request): self
    {
        return new self(
            body: $request->validated('body'),
            isPrivate: (bool) $request->validated('is_private', false),
        );
    }
}
