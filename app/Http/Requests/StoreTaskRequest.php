<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreTaskRequest extends FormRequest
{
    public function rules(): array
    {
        return [
            'title' => ['required', 'string', 'max:255'],
            'description' => ['nullable', 'string'],
            'assignee_id' => ['nullable', 'integer', 'exists:users,id'],
            'board_column_id' => ['required', 'integer', 'exists:board_columns,id'],
            'priority' => ['nullable', Rule::in(['low', 'medium', 'high', 'urgent'])],
            'due_at' => ['nullable', 'date'],
        ];
    }
}
