<?php

namespace App\Services;

use App\Models\Company;
use App\Models\Contact;
use App\Models\Deal;
use App\Models\Organization;
use App\Models\PipelineStage;
use App\Models\User;
use Illuminate\Database\Eloquent\Collection;

class CrmService
{
    public function getCompanies(User $user): Collection
    {
        return Company::where('organization_id', $user->organization_id)->get();
    }

    public function createCompany(User $user, array $data): Company
    {
        return Company::create(array_merge($data, ['organization_id' => $user->organization_id]));
    }

    public function deleteCompany(Company $company): void
    {
        $company->delete();
    }

    public function getContacts(User $user): Collection
    {
        return Contact::where('organization_id', $user->organization_id)
            ->with('company')
            ->get();
    }

    public function createContact(User $user, array $data): Contact
    {
        return Contact::create(array_merge($data, ['organization_id' => $user->organization_id]));
    }

    public function deleteContact(Contact $contact): void
    {
        $contact->delete();
    }

    public function getStages(User $user): Collection
    {
        return PipelineStage::where('organization_id', $user->organization_id)
            ->orderBy('position')
            ->get();
    }

    public function seedDefaultStages(Organization $org): void
    {
        $exists = PipelineStage::where('organization_id', $org->id)->exists();

        if ($exists) {
            return;
        }

        $stages = ['Lead', 'Qualified', 'Proposal', 'Won', 'Lost'];

        foreach ($stages as $index => $name) {
            PipelineStage::create([
                'organization_id' => $org->id,
                'name' => $name,
                'position' => $index,
            ]);
        }
    }

    public function getDeals(User $user, ?int $stageId = null): Collection
    {
        $query = Deal::where('organization_id', $user->organization_id)
            ->with('contact');

        if ($stageId !== null) {
            $query->where('pipeline_stage_id', $stageId);
        }

        return $query->orderBy('position')->get();
    }

    public function createDeal(User $user, array $data): Deal
    {
        $stageId = $data['pipeline_stage_id'];

        $maxPosition = Deal::where('organization_id', $user->organization_id)
            ->where('pipeline_stage_id', $stageId)
            ->max('position') ?? -1;

        return Deal::create(array_merge($data, [
            'organization_id' => $user->organization_id,
            'position' => $maxPosition + 1,
        ]));
    }

    public function updateDeal(Deal $deal, array $data): Deal
    {
        $deal->update($data);

        return $deal->fresh();
    }

    public function moveDeal(Deal $deal, int $stageId, int $position): Deal
    {
        $deal->update([
            'pipeline_stage_id' => $stageId,
            'position' => $position,
        ]);

        return $deal->fresh();
    }

    public function deleteDeal(Deal $deal): void
    {
        $deal->delete();
    }

    public function getPipelineWithDeals(User $user): Collection
    {
        return PipelineStage::where('organization_id', $user->organization_id)
            ->orderBy('position')
            ->with(['deals' => function ($query) use ($user) {
                $query->where('organization_id', $user->organization_id)
                    ->with('contact')
                    ->orderBy('position');
            }])
            ->get();
    }
}
