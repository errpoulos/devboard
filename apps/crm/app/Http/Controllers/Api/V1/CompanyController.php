<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreCompanyRequest;
use App\Http\Resources\CompanyResource;
use App\Models\Company;
use App\Services\CrmService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

class CompanyController extends Controller
{
    public function __construct(private readonly CrmService $crmService) {}

    public function index(Request $request): AnonymousResourceCollection
    {
        $companies = $this->crmService->getCompanies($request->user());

        return CompanyResource::collection($companies);
    }

    public function store(StoreCompanyRequest $request): CompanyResource
    {
        $this->authorize('create', Company::class);

        $company = $this->crmService->createCompany($request->user(), $request->validated());

        return new CompanyResource($company);
    }

    public function destroy(Request $request, Company $company): JsonResponse
    {
        $this->authorize('delete', $company);

        $this->crmService->deleteCompany($company);

        return response()->json(['message' => 'Company deleted.']);
    }
}
