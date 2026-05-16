<?php

namespace App\Listeners;

use App\Events\MemberInvited;
use App\Mail\WorkspaceInvitationMail;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Support\Facades\Mail;

class SendInvitationEmail implements ShouldQueue
{
    public string $queue = 'mail';

    public function handle(MemberInvited $event): void
    {
        Mail::to($event->invitation->email)
            ->send(new WorkspaceInvitationMail($event->invitation));
    }
}
