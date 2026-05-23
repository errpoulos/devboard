<?php

use App\Models\Contact;
use App\Models\Deal;
use App\Models\Organization;
use App\Models\PipelineStage;
use App\Models\User;
use Laravel\Sanctum\Sanctum;

function crmOrg(string $slug): Organization
{
    return Organization::create([
        'name' => $slug,
        'slug' => $slug,
        'plan' => 'free',
        'status' => 'active',
    ]);
}

function crmUser(Organization $org): User
{
    return User::factory()->create(['organization_id' => $org->id]);
}

function crmContact(Organization $org): Contact
{
    return Contact::create([
        'organization_id' => $org->id,
        'first_name' => 'Jane',
        'last_name' => 'Doe',
    ]);
}

function crmStage(Organization $org): PipelineStage
{
    return PipelineStage::create([
        'organization_id' => $org->id,
        'name' => 'Qualified',
        'position' => 1,
    ]);
}

function crmDeal(Organization $org, PipelineStage $stage): Deal
{
    return Deal::create([
        'organization_id' => $org->id,
        'pipeline_stage_id' => $stage->id,
        'title' => 'Test Deal',
        'status' => 'open',
        'position' => 1,
    ]);
}

// ── Contacts ─────────────────────────────────────────────────────────────

it('contact index returns only own org contacts', function () {
    $orgA = crmOrg('crm-a');
    $orgB = crmOrg('crm-b');
    $userA = crmUser($orgA);

    crmContact($orgA);
    crmContact($orgA);
    crmContact($orgB); // must not appear

    Sanctum::actingAs($userA);

    $response = $this->getJson('/api/v1/contacts');

    $response->assertOk();
    expect($response->json('data'))->toHaveCount(2);
});

it('cannot delete a contact from another organization', function () {
    $orgA = crmOrg('crm-a2');
    $orgB = crmOrg('crm-b2');
    $userA = crmUser($orgA);
    $contactB = crmContact($orgB);

    Sanctum::actingAs($userA);

    $this->deleteJson("/api/v1/contacts/{$contactB->id}")
        ->assertForbidden();
});

it('can delete own org contact', function () {
    $org = crmOrg('crm-own');
    $user = crmUser($org);
    $contact = crmContact($org);

    Sanctum::actingAs($user);

    $this->deleteJson("/api/v1/contacts/{$contact->id}")
        ->assertOk();
});

// ── Deals ─────────────────────────────────────────────────────────────────

it('deal index returns only own org deals', function () {
    $orgA = crmOrg('crm-da');
    $orgB = crmOrg('crm-db');
    $userA = crmUser($orgA);
    $stageA = crmStage($orgA);
    $stageB = crmStage($orgB);

    crmDeal($orgA, $stageA);
    crmDeal($orgA, $stageA);
    crmDeal($orgB, $stageB); // must not appear

    Sanctum::actingAs($userA);

    $response = $this->getJson('/api/v1/deals');

    $response->assertOk();
    expect($response->json('data'))->toHaveCount(2);
});

it('cannot update a deal from another organization', function () {
    $orgA = crmOrg('crm-ua');
    $orgB = crmOrg('crm-ub');
    $userA = crmUser($orgA);
    $stageB = crmStage($orgB);
    $dealB = crmDeal($orgB, $stageB);

    Sanctum::actingAs($userA);

    $this->putJson("/api/v1/deals/{$dealB->id}", ['title' => 'hijack'])
        ->assertForbidden();
});

it('cannot delete a deal from another organization', function () {
    $orgA = crmOrg('crm-dela');
    $orgB = crmOrg('crm-delb');
    $userA = crmUser($orgA);
    $stageB = crmStage($orgB);
    $dealB = crmDeal($orgB, $stageB);

    Sanctum::actingAs($userA);

    $this->deleteJson("/api/v1/deals/{$dealB->id}")
        ->assertForbidden();
});

it('can update own deal', function () {
    $org = crmOrg('crm-own2');
    $user = crmUser($org);
    $stage = crmStage($org);
    $deal = crmDeal($org, $stage);

    Sanctum::actingAs($user);

    $this->putJson("/api/v1/deals/{$deal->id}", ['title' => 'Updated Deal'])
        ->assertOk()
        ->assertJsonPath('data.title', 'Updated Deal');
});

// ── Pipeline only shows own org stages ───────────────────────────────────

it('pipeline index returns only own org stages', function () {
    $orgA = crmOrg('crm-pa');
    $orgB = crmOrg('crm-pb');
    $userA = crmUser($orgA);

    crmStage($orgA);
    crmStage($orgA);
    crmStage($orgB); // must not appear

    Sanctum::actingAs($userA);

    $response = $this->getJson('/api/v1/pipeline');

    $response->assertOk();
    expect($response->json('data'))->toHaveCount(2);
});
