<?php

namespace App\DTOs;

use App\Http\Requests\StoreBoardRequest;

readonly class StoreBoardDTO
{
    public function __construct(
        public string $name,
        public ?string $description,
    ) {}

    public static function fromRequest(StoreBoardRequest $request): self
    {
        return new self(
            name: $request->validated('name'),
            description: $request->validated('description'),
        );
    }
}
