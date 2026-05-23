<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreDealRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'title' => ['required', 'string', 'max:255'],
            'pipeline_stage_id' => ['required', 'integer', 'exists:crm_pipeline_stages,id'],
            'contact_id' => ['nullable', 'integer', 'exists:crm_contacts,id'],
            'value' => ['nullable', 'numeric', 'min:0'],
            'status' => ['nullable', 'in:open,won,lost'],
        ];
    }
}
