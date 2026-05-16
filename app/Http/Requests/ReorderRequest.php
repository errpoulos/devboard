<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class ReorderRequest extends FormRequest
{
    public function rules(): array
    {
        return [
            'column_id' => ['sometimes', 'integer', 'exists:board_columns,id'],
            'ordered_ids' => ['required', 'array'],
            'ordered_ids.*' => ['integer'],
        ];
    }
}
