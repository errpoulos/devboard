<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('tickets', function (Blueprint $table) {
            $table->enum('type', ['support_request', 'bug_report', 'feature_request'])
                  ->default('support_request')
                  ->after('priority');
            $table->unsignedBigInteger('assigned_to')->nullable()->after('type');
            $table->foreign('assigned_to')->references('id')->on('users')->nullOnDelete();
            $table->unsignedBigInteger('devboard_task_id')->nullable()->after('assigned_to');
        });
    }

    public function down(): void
    {
        Schema::table('tickets', function (Blueprint $table) {
            $table->dropForeign(['assigned_to']);
            $table->dropColumn(['type', 'assigned_to', 'devboard_task_id']);
        });
    }
};
