<?php

namespace App\Models\Devboard;

use App\Models\User;
use Illuminate\Database\Eloquent\Model;

class DevboardComment extends Model
{
    protected $table = 'comments';

    protected $guarded = ['*'];

    public function author()
    {
        return $this->belongsTo(User::class, 'user_id');
    }
}
