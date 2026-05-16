<?php

namespace App\DTOs;

use App\Http\Requests\StoreCommentRequest;

readonly class StoreCommentDTO
{
    public function __construct(
        public string $body,
    ) {}

    public static function fromRequest(StoreCommentRequest $request): self
    {
        return new self(
            body: $request->validated('body'),
        );
    }
}
