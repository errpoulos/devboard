<?php

use App\Models\Organization;
use App\Models\Ticket;
use App\Models\User;
use Laravel\Sanctum\Sanctum;

function makeOrg(string $slug): Organization
{
    return Organization::create([
        'name' => $slug,
        'slug' => $slug,
        'plan' => 'free',
        'status' => 'active',
    ]);
}

function makeUser(Organization $org): User
{
    return User::factory()->create([
        'organization_id' => $org->id,
        'password' => bcrypt('password'),
    ]);
}

function makeTicket(Organization $org, User $user): Ticket
{
    return Ticket::create([
        'organization_id' => $org->id,
        'user_id' => $user->id,
        'subject' => 'Test ticket',
        'description' => 'Test description',
        'status' => 'open',
        'priority' => 'medium',
    ]);
}

// ── Ticket index only returns own org tickets ──────────────────────────────

it('index returns only tickets from the authenticated user org', function () {
    $orgA = makeOrg('org-a');
    $orgB = makeOrg('org-b');
    $userA = makeUser($orgA);
    $userB = makeUser($orgB);

    makeTicket($orgA, $userA);
    makeTicket($orgA, $userA);
    makeTicket($orgB, $userB); // must NOT appear for userA

    Sanctum::actingAs($userA);

    $response = $this->getJson('/api/v1/tickets');

    $response->assertOk();
    $data = $response->json('data');
    expect($data)->toHaveCount(2);
    foreach ($data as $t) {
        expect($t['id'])->not->toBe(makeTicket($orgB, $userB)->id);
    }
});

// ── Cross-org show is blocked ──────────────────────────────────────────────

it('cannot view a ticket belonging to another organization', function () {
    $orgA = makeOrg('org-a2');
    $orgB = makeOrg('org-b2');
    $userA = makeUser($orgA);
    $userB = makeUser($orgB);

    $ticketB = makeTicket($orgB, $userB);

    Sanctum::actingAs($userA);

    $this->getJson("/api/v1/tickets/{$ticketB->id}")
        ->assertForbidden();
});

// ── Cross-org update is blocked ────────────────────────────────────────────

it('cannot update a ticket belonging to another organization', function () {
    $orgA = makeOrg('org-a3');
    $orgB = makeOrg('org-b3');
    $userA = makeUser($orgA);
    $userB = makeUser($orgB);

    $ticketB = makeTicket($orgB, $userB);

    Sanctum::actingAs($userA);

    $this->putJson("/api/v1/tickets/{$ticketB->id}", ['status' => 'closed'])
        ->assertForbidden();
});

// ── Cross-org delete is blocked ────────────────────────────────────────────

it('cannot delete a ticket belonging to another organization', function () {
    $orgA = makeOrg('org-a4');
    $orgB = makeOrg('org-b4');
    $userA = makeUser($orgA);
    $userB = makeUser($orgB);

    $ticketB = makeTicket($orgB, $userB);

    Sanctum::actingAs($userA);

    $this->deleteJson("/api/v1/tickets/{$ticketB->id}")
        ->assertForbidden();
});

// ── Cross-org reply listing is blocked ────────────────────────────────────

it('cannot list replies on a ticket belonging to another organization', function () {
    $orgA = makeOrg('org-a5');
    $orgB = makeOrg('org-b5');
    $userA = makeUser($orgA);
    $userB = makeUser($orgB);

    $ticketB = makeTicket($orgB, $userB);

    Sanctum::actingAs($userA);

    $this->getJson("/api/v1/tickets/{$ticketB->id}/replies")
        ->assertForbidden();
});

// ── Cross-org reply creation is blocked ───────────────────────────────────

it('cannot post a reply to a ticket belonging to another organization', function () {
    $orgA = makeOrg('org-a6');
    $orgB = makeOrg('org-b6');
    $userA = makeUser($orgA);
    $userB = makeUser($orgB);

    $ticketB = makeTicket($orgB, $userB);

    Sanctum::actingAs($userA);

    $this->postJson("/api/v1/tickets/{$ticketB->id}/replies", ['body' => 'hijack'])
        ->assertForbidden();
});

// ── Own-org operations succeed ────────────────────────────────────────────

it('can view and update own ticket', function () {
    $org = makeOrg('org-own');
    $user = makeUser($org);
    $ticket = makeTicket($org, $user);

    Sanctum::actingAs($user);

    $this->getJson("/api/v1/tickets/{$ticket->id}")->assertOk();

    $this->putJson("/api/v1/tickets/{$ticket->id}", ['status' => 'closed'])
        ->assertOk()
        ->assertJsonPath('data.status', 'closed');
});
