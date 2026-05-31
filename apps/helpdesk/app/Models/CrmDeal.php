<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class CrmDeal extends Model
{
    protected $table = 'crm_deals';

    public $timestamps = true;

    protected $guarded = ['*']; // read-only

    // no relationships needed for the summary
}
