<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Organization extends Model
{
    protected $table = 'organizations';

    protected $fillable = [
        'name',
        'slug',
        'plan',
        'status',
    ];

    public function users(): HasMany
    {
        return $this->hasMany(User::class);
    }

    public function customers(): BelongsToMany
    {
        return $this->belongsToMany(User::class, 'organization_user');
    }

    public function tickets(): HasMany
    {
        return $this->hasMany(Ticket::class);
    }
}
