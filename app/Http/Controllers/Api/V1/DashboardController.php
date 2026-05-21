<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\Workspace;
use App\Services\DashboardService;
use Illuminate\Http\JsonResponse;

class DashboardController extends Controller
{
    public function __construct(private DashboardService $dashboardService) {}

    public function show(Workspace $workspace): JsonResponse
    {
        $this->authorize('view', $workspace);

        return response()->json([
            'data' => $this->dashboardService->metrics($workspace),
        ]);
    }
}
