<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;

class SendWeeklyDigest extends Command
{
    protected $signature = 'app:send-weekly-digest';

    protected $description = 'Send weekly activity digest emails to workspace members';

    public function handle(): int
    {
        $this->info('Sending weekly digest... (not yet implemented)');

        return self::SUCCESS;
    }
}
