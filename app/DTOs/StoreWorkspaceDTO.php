<?php

namespace App\DTOs;

use App\Http\Requests\StoreWorkspaceRequest;

readonly class StoreWorkspaceDTO
{
    public function __construct(
        public string $name,
        public string $slug,
    ) {}

    public static function fromRequest(StoreWorkspaceRequest $request): self
    {
        return new self(
            name: $request->validated('name'),
            slug: $request->validated('slug'),
        );
    }
}
