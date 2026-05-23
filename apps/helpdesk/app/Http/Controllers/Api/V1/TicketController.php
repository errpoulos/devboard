<?php

namespace App\Http\Controllers\Api\V1;

use App\DTOs\StoreTicketDTO;
use App\DTOs\UpdateTicketDTO;
use App\Http\Controllers\Controller;
use App\Http\Requests\StoreTicketRequest;
use App\Http\Requests\UpdateTicketRequest;
use App\Http\Resources\TicketResource;
use App\Models\Ticket;
use App\Services\TicketService;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\ResourceCollection;
use Illuminate\Http\Response;

class TicketController extends Controller
{
    public function __construct(private readonly TicketService $ticketService) {}

    public function index(Request $request): ResourceCollection
    {
        $tickets = Ticket::with('user')
            ->withCount('replies')
            ->where('organization_id', $request->user()->organization_id)
            ->latest()
            ->paginate(25);

        return TicketResource::collection($tickets);
    }

    public function store(StoreTicketRequest $request): TicketResource
    {
        $ticket = $this->ticketService->create(
            user: $request->user(),
            data: StoreTicketDTO::fromRequest($request),
        );

        return new TicketResource($ticket);
    }

    public function show(Request $request, Ticket $ticket): TicketResource
    {
        $this->authorize('view', $ticket);

        return new TicketResource(
            $ticket->load('user')->loadCount('replies')
        );
    }

    public function update(UpdateTicketRequest $request, Ticket $ticket): TicketResource
    {
        $this->authorize('update', $ticket);

        $ticket = $this->ticketService->update(
            ticket: $ticket,
            data: UpdateTicketDTO::fromRequest($request),
        );

        return new TicketResource($ticket->loadCount('replies'));
    }

    public function destroy(Request $request, Ticket $ticket): Response
    {
        $this->authorize('delete', $ticket);

        $this->ticketService->delete($ticket);

        return response()->noContent();
    }
}
