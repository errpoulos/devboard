<?php

namespace App\DTOs;

use App\Http\Requests\InviteMemberRequest;

readonly class InviteMemberDTO
{
    public function __construct(
        public string $email,
        public string $role,
    ) {}

    public static function fromRequest(InviteMemberRequest $request): self
    {
        return new self(
            email: $request->validated('email'),
            role: $request->validated('role', 'member'),
        );
    }
}
