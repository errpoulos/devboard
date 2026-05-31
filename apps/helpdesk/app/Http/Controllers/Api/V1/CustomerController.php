<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Resources\TicketResource;
use App\Http\Resources\UserResource;
use App\Models\CrmDeal;
use App\Models\ClientNote;
use App\Models\Ticket;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Routing\Controller;

class CustomerController extends Controller
{
    public function index(Request $request): AnonymousResourceCollection
    {
        if (! $request->user()->isAgent()) {
            abort(403);
        }

        $customers = User::where(fn ($q) => $q->whereNull('role')->orWhere('role', 'customer'))
            ->withCount('tickets')
            ->orderBy('name')
            ->paginate(50);

        return UserResource::collection($customers);
    }

    public function show(Request $request, User $user): JsonResponse
    {
        if (! $request->user()->isAgent()) {
            abort(403);
        }

        $user->load('organizations');

        $tickets = Ticket::where('user_id', $user->id)
            ->withCount('replies')
            ->latest()
            ->get();

        $notes = ClientNote::where('subject_user_id', $user->id)
            ->with('author')
            ->orderBy('created_at', 'desc')
            ->get();

        return response()->json([
            'data' => array_merge(
                (new UserResource($user))->resolve($request),
                [
                    'tickets' => TicketResource::collection($tickets)->resolve(),
                    'notes' => $notes->map(fn ($n) => [
                        'id' => $n->id,
                        'category' => $n->category,
                        'body' => $n->body,
                        'created_at' => $n->created_at,
                        'author' => $n->author ? ['id' => $n->author->id, 'name' => $n->author->name] : null,
                    ]),
                ],
            ),
        ]);
    }

    public function crmSummary(Request $request, User $user): JsonResponse
    {
        if (! $request->user()->isAgent()) {
            abort(403);
        }

        $deals = CrmDeal::where('organization_id', $user->organization_id)
            ->orderBy('created_at', 'desc')
            ->limit(10)
            ->get(['id', 'title', 'value', 'status', 'created_at']);

        return response()->json(['data' => $deals]);
    }
}
