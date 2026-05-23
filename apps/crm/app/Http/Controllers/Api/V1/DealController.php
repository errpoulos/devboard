<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreDealRequest;
use App\Http\Requests\UpdateDealRequest;
use App\Http\Resources\DealResource;
use App\Models\Deal;
use App\Services\CrmService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

class DealController extends Controller
{
    public function __construct(private readonly CrmService $crmService) {}

    public function index(Request $request): AnonymousResourceCollection
    {
        $stageId = $request->query('stage_id') ? (int) $request->query('stage_id') : null;

        $deals = $this->crmService->getDeals($request->user(), $stageId);

        return DealResource::collection($deals);
    }

    public function store(StoreDealRequest $request): DealResource
    {
        $this->authorize('create', Deal::class);

        $deal = $this->crmService->createDeal($request->user(), $request->validated());

        return new DealResource($deal);
    }

    public function update(UpdateDealRequest $request, Deal $deal): DealResource
    {
        $this->authorize('update', $deal);

        $data = $request->validated();

        if (isset($data['pipeline_stage_id'])) {
            $position = $data['position'] ?? 0;
            $deal = $this->crmService->moveDeal($deal, $data['pipeline_stage_id'], $position);

            unset($data['pipeline_stage_id'], $data['position']);
        }

        if (! empty($data)) {
            $deal = $this->crmService->updateDeal($deal, $data);
        }

        return new DealResource($deal);
    }

    public function destroy(Request $request, Deal $deal): JsonResponse
    {
        $this->authorize('delete', $deal);

        $this->crmService->deleteDeal($deal);

        return response()->json(['message' => 'Deal deleted.']);
    }
}
