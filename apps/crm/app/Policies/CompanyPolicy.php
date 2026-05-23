<?php

namespace App\Policies;

use App\Models\Company;
use App\Models\User;

class CompanyPolicy
{
    public function view(User $user, Company $company): bool
    {
        return $user->organization_id === $company->organization_id;
    }

    public function create(User $user): bool
    {
        return $user->organization_id !== null;
    }

    public function update(User $user, Company $company): bool
    {
        return $user->organization_id === $company->organization_id;
    }

    public function delete(User $user, Company $company): bool
    {
        return $user->organization_id === $company->organization_id;
    }
}
