<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class UpdateBoardColumnRequest extends FormRequest
{
    public function rules(): array
    {
        return [
            'name' => ['sometimes', 'string', 'max:100'],
            'color' => ['sometimes', 'nullable', 'string', 'max:20'],
        ];
    }
}
