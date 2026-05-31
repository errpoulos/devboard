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
        $user = $request->user();
        $query = Ticket::with('user')->withCount('replies');

        if ($user->isCustomer()) {
            // Customers see only their own tickets
            $query->where('user_id', $user->id);
        } else {
            $query->where('organization_id', $user->organization_id);
        }

        // Filters — comma-separated values supported for status/type/priority
        $query->when($request->status, fn ($q) => $q->whereIn('status', explode(',', $request->status)));
        $query->when($request->type, fn ($q) => $q->whereIn('type', explode(',', $request->type)));
        $query->when($request->priority, fn ($q) => $q->whereIn('priority', explode(',', $request->priority)));
        $query->when($request->date_from, fn ($q) => $q->whereDate('created_at', '>=', $request->date_from));
        $query->when($request->date_to, fn ($q) => $q->whereDate('created_at', '<=', $request->date_to));
        $query->when($request->search, fn ($q) => $q->where('subject', 'like', '%' . $request->search . '%'));

        if ($request->user()->isAgent() && $request->filled('assigned_to')) {
            if ($request->assigned_to === 'unassigned' || $request->assigned_to === '0') {
                $query->whereNull('assigned_to');
            } else {
                $query->where('assigned_to', $request->assigned_to);
            }
        }

        $tickets = $query->latest()->paginate(25);

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
