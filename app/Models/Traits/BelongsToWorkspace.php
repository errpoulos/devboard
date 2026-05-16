<?php

namespace App\Models\Traits;

use App\Models\Scopes\WorkspaceScope;

trait BelongsToWorkspace
{
    protected static function booted(): void
    {
        static::addGlobalScope(new WorkspaceScope);
    }
}
