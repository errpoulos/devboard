<?php

namespace App\Policies;

use App\Models\Ticket;
use App\Models\User;

class TicketPolicy
{
    public function view(User $user, Ticket $ticket): bool
    {
        return $ticket->organization_id === $user->organization_id;
    }

    public function update(User $user, Ticket $ticket): bool
    {
        return $ticket->organization_id === $user->organization_id;
    }

    public function delete(User $user, Ticket $ticket): bool
    {
        return $ticket->organization_id === $user->organization_id
            && ($ticket->user_id === $user->id || $user->is_super_admin);
    }
}
