<?php

namespace App\Models\Devboard;

use Illuminate\Database\Eloquent\Model;

class DevboardTask extends Model
{
    protected $table = 'tasks';

    protected $fillable = [
        'workspace_id',
        'board_column_id',
        'title',
        'description',
        'priority',
        'position',
        'helpdesk_ticket_id',
    ];

    public function column()
    {
        return $this->belongsTo(DevboardBoardColumn::class, 'board_column_id');
    }
}
