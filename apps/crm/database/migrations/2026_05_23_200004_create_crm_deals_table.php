<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('crm_deals', function (Blueprint $table) {
            $table->bigIncrements('id');
            $table->bigInteger('organization_id')->unsigned();
            $table->bigInteger('pipeline_stage_id')->unsigned();
            $table->bigInteger('contact_id')->unsigned()->nullable();
            $table->string('title');
            $table->decimal('value', 12, 2)->nullable();
            $table->enum('status', ['open', 'won', 'lost'])->default('open');
            $table->integer('position')->default(0);
            $table->timestamps();
            $table->foreign('organization_id')->references('id')->on('organizations')->cascadeOnDelete();
            $table->foreign('pipeline_stage_id')->references('id')->on('crm_pipeline_stages');
            $table->foreign('contact_id')->references('id')->on('crm_contacts')->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('crm_deals');
    }
};
