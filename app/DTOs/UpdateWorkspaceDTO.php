<?php

namespace App\DTOs;

use App\Http\Requests\UpdateWorkspaceRequest;

readonly class UpdateWorkspaceDTO
{
    public function __construct(
        public string $name,
        public string $slug,
    ) {}

    public static function fromRequest(UpdateWorkspaceRequest $request): self
    {
        return new self(
            name: $request->validated('name'),
            slug: $request->validated('slug'),
        );
    }
}
