<?php

namespace App\Policies;

use App\Models\Ticket;
use App\Models\User;

class TicketPolicy
{
    public function viewAny(User $user): bool
    {
        return true;
    }

    public function view(User $user, Ticket $ticket): bool
    {
        if ($user->isAgent()) {
            return $user->organization_id === null
                || $ticket->organization_id === $user->organization_id;
        }

        // Customers: just own their ticket; org check skipped when user has no org
        return $ticket->user_id === $user->id;
    }

    public function update(User $user, Ticket $ticket): bool
    {
        if (! $user->isAgent()) {
            return false;
        }

        return $user->organization_id === null
            || $ticket->organization_id === $user->organization_id;
    }

    public function delete(User $user, Ticket $ticket): bool
    {
        if ($user->isAgent()) {
            return $user->organization_id === null
                || $ticket->organization_id === $user->organization_id;
        }

        return $ticket->user_id === $user->id;
    }
}
