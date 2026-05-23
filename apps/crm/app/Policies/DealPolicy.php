<?php

namespace App\Policies;

use App\Models\Deal;
use App\Models\User;

class DealPolicy
{
    public function view(User $user, Deal $deal): bool
    {
        return $user->organization_id === $deal->organization_id;
    }

    public function create(User $user): bool
    {
        return $user->organization_id !== null;
    }

    public function update(User $user, Deal $deal): bool
    {
        return $user->organization_id === $deal->organization_id;
    }

    public function delete(User $user, Deal $deal): bool
    {
        return $user->organization_id === $deal->organization_id;
    }
}
