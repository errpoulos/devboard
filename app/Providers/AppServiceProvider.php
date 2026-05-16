<?php

namespace App\Providers;

use App\Events\MemberInvited;
use App\Events\TaskCreated;
use App\Events\TaskDeleted;
use App\Events\TaskMoved;
use App\Events\TaskUpdated;
use App\Listeners\LogTaskActivity;
use App\Listeners\SendInvitationEmail;
use Illuminate\Support\Facades\Event;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    public function register(): void {}

    public function boot(): void
    {
        Event::listen(TaskCreated::class, [LogTaskActivity::class, 'handleTaskCreated']);
        Event::listen(TaskUpdated::class, [LogTaskActivity::class, 'handleTaskUpdated']);
        Event::listen(TaskMoved::class, [LogTaskActivity::class, 'handleTaskMoved']);
        Event::listen(TaskDeleted::class, [LogTaskActivity::class, 'handleTaskDeleted']);
        Event::listen(MemberInvited::class, SendInvitationEmail::class);
    }
}
