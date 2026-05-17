<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateTaskRequest extends FormRequest
{
    public function rules(): array
    {
        return [
            'title' => ['sometimes', 'string', 'max:255'],
            'description' => ['nullable', 'string'],
            'assignee_id' => ['nullable', 'integer', 'exists:users,id'],
            'board_column_id' => ['sometimes', 'integer', 'exists:board_columns,id'],
            'priority' => ['sometimes', Rule::in(['low', 'medium', 'high', 'urgent'])],
            'due_at' => ['nullable', 'date'],
            'completed_at' => ['nullable', 'date'],
            'story_points' => ['sometimes', 'nullable', 'integer', 'min:0', 'max:999'],
        ];
    }
}
