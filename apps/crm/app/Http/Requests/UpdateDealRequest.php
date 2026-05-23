<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class UpdateDealRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'title' => ['sometimes', 'string', 'max:255'],
            'pipeline_stage_id' => ['sometimes', 'integer', 'exists:crm_pipeline_stages,id'],
            'contact_id' => ['sometimes', 'nullable', 'integer', 'exists:crm_contacts,id'],
            'value' => ['sometimes', 'nullable', 'numeric', 'min:0'],
            'status' => ['sometimes', 'in:open,won,lost'],
            'position' => ['sometimes', 'integer', 'min:0'],
        ];
    }
}
