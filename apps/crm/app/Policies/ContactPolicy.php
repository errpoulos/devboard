<?php

namespace App\Policies;

use App\Models\Contact;
use App\Models\User;

class ContactPolicy
{
    public function view(User $user, Contact $contact): bool
    {
        return $user->organization_id === $contact->organization_id;
    }

    public function create(User $user): bool
    {
        return $user->organization_id !== null;
    }

    public function update(User $user, Contact $contact): bool
    {
        return $user->organization_id === $contact->organization_id;
    }

    public function delete(User $user, Contact $contact): bool
    {
        return $user->organization_id === $contact->organization_id;
    }
}
