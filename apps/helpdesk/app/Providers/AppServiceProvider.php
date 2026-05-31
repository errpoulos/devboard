<?php

namespace App\Providers;

use App\Models\Ticket;
use App\Policies\TicketPolicy;
use App\Services\DevboardBridge;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    public function register(): void
    {
        $this->app->singleton(DevboardBridge::class);
    }

    public function boot(): void
    {
        Gate::policy(Ticket::class, TicketPolicy::class);
    }
}
