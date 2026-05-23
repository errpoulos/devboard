<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class UpdateTicketRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'subject' => ['sometimes', 'string', 'max:255'],
            'description' => ['sometimes', 'string'],
            'status' => ['sometimes', 'string', 'in:open,in_progress,resolved,closed'],
            'priority' => ['sometimes', 'string', 'in:low,medium,high,urgent'],
        ];
    }
}
