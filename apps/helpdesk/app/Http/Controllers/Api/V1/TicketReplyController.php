<?php

namespace App\Http\Controllers\Api\V1;

use App\DTOs\StoreTicketReplyDTO;
use App\Http\Controllers\Controller;
use App\Http\Requests\StoreTicketReplyRequest;
use App\Http\Resources\TicketReplyResource;
use App\Models\Ticket;
use App\Services\TicketService;
use Illuminate\Http\Resources\Json\ResourceCollection;

class TicketReplyController extends Controller
{
    public function __construct(private readonly TicketService $ticketService) {}

    public function index(Ticket $ticket): ResourceCollection
    {
        $this->authorize('view', $ticket);

        $replies = $ticket->replies()->with('user')->latest()->get();

        return TicketReplyResource::collection($replies);
    }

    public function store(StoreTicketReplyRequest $request, Ticket $ticket): TicketReplyResource
    {
        $this->authorize('view', $ticket);

        $reply = $this->ticketService->reply(
            ticket: $ticket,
            user: $request->user(),
            data: StoreTicketReplyDTO::fromRequest($request),
        );

        return new TicketReplyResource($reply);
    }
}
