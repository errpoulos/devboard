<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Resources\PipelineStageResource;
use App\Services\CrmService;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

class PipelineController extends Controller
{
    public function __construct(private readonly CrmService $crmService) {}

    public function index(Request $request): AnonymousResourceCollection
    {
        $stages = $this->crmService->getPipelineWithDeals($request->user());

        return PipelineStageResource::collection($stages);
    }
}
