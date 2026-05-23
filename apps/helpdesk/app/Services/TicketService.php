<?php

namespace App\Services;

use App\DTOs\StoreTicketDTO;
use App\DTOs\StoreTicketReplyDTO;
use App\DTOs\UpdateTicketDTO;
use App\Models\Ticket;
use App\Models\TicketReply;
use App\Models\User;

class TicketService
{
    public function create(User $user, StoreTicketDTO $data): Ticket
    {
        $ticket = Ticket::create([
            'organization_id' => $user->organization_id,
            'user_id' => $user->id,
            'subject' => $data->subject,
            'description' => $data->description,
            'priority' => $data->priority,
            'status' => 'open',
        ]);

        return $ticket->load('user');
    }

    public function update(Ticket $ticket, UpdateTicketDTO $data): Ticket
    {
        $fieldMap = [
            'subject' => $data->subject,
            'description' => $data->description,
            'status' => $data->status,
            'priority' => $data->priority,
        ];

        $updateData = array_intersect_key($fieldMap, array_flip($data->keys));

        if (! empty($updateData)) {
            $ticket->update($updateData);
        }

        return $ticket->fresh(['user']);
    }

    public function delete(Ticket $ticket): void
    {
        $ticket->delete();
    }

    public function reply(Ticket $ticket, User $user, StoreTicketReplyDTO $data): TicketReply
    {
        $reply = TicketReply::create([
            'ticket_id' => $ticket->id,
            'user_id' => $user->id,
            'body' => $data->body,
        ]);

        return $reply->load('user');
    }
}
