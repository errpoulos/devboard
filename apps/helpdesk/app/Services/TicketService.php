<?php

namespace App\Services;

use App\DTOs\StoreTicketDTO;
use App\DTOs\StoreTicketReplyDTO;
use App\DTOs\UpdateTicketDTO;
use App\Models\Organization;
use App\Models\Ticket;
use App\Models\TicketReply;
use App\Models\User;

class TicketService
{
    public function __construct(
        private readonly DevboardBridge $bridge,
    ) {}

    public function create(User $user, StoreTicketDTO $data): Ticket
    {
        if ($user->isCustomer()) {
            $orgId = $data->organizationId
                ?? $user->organization_id
                ?? $user->organizations()->value('organizations.id')
                ?? Organization::value('id');
        } else {
            $orgId = $user->organization_id
                ?? Organization::value('id');
        }

        if (! $orgId) {
            throw new \InvalidArgumentException('No organization found for this user.');
        }

        $ticket = Ticket::create([
            'organization_id' => $orgId,
            'user_id' => $user->id,
            'subject' => $data->subject,
            'description' => $data->description,
            'priority' => $data->priority,
            'type' => $data->type,
            'status' => 'open',
        ]);

        if (in_array($data->type, ['bug_report', 'feature_request'], true)) {
            $this->createDevboardTask($ticket);
        }

        return $ticket->load('user');
    }

    public function update(Ticket $ticket, UpdateTicketDTO $data): Ticket
    {
        $fieldMap = [
            'subject' => $data->subject,
            'description' => $data->description,
            'status' => $data->status,
            'priority' => $data->priority,
            'type' => $data->type,
            'assigned_to' => $data->assignedTo,
        ];

        $updateData = array_intersect_key($fieldMap, array_flip($data->keys));

        if (! empty($updateData)) {
            $previousType = $ticket->type;

            $ticket->update($updateData);

            $newType = $ticket->fresh()->type;

            if (
                in_array($newType, ['bug_report', 'feature_request'], true)
                && $previousType !== $newType
                && $ticket->devboard_task_id === null
            ) {
                $this->createDevboardTask($ticket->fresh());
            }
        }

        return $ticket->fresh(['user']);
    }

    public function delete(Ticket $ticket): void
    {
        $ticket->delete();
    }

    public function reply(Ticket $ticket, User $user, StoreTicketReplyDTO $data): TicketReply
    {
        if ($user->isCustomer()) {
            $data = new StoreTicketReplyDTO(
                body: $data->body,
                isPrivate: false,
            );
        }

        $reply = TicketReply::create([
            'ticket_id' => $ticket->id,
            'user_id' => $user->id,
            'body' => $data->body,
            'is_private' => $data->isPrivate,
        ]);

        return $reply->load('user');
    }

    private function createDevboardTask(Ticket $ticket): void
    {
        $taskId = $this->bridge->createTask($ticket);
        if ($taskId) {
            $ticket->devboard_task_id = $taskId;
            $ticket->save();
        }
    }
}
