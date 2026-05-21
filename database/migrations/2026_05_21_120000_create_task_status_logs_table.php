<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('task_status_logs', function (Blueprint $table) {
            $table->bigIncrements('id');
            $table->bigInteger('task_id')->unsigned();
            $table->bigInteger('board_column_id')->unsigned();
            $table->timestamp('entered_at');
            $table->timestamp('exited_at')->nullable();

            $table->foreign('task_id')->references('id')->on('tasks')->cascadeOnDelete();
            $table->foreign('board_column_id')->references('id')->on('board_columns')->cascadeOnDelete();

            $table->index(['task_id', 'exited_at']);
            $table->index(['board_column_id', 'exited_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('task_status_logs');
    }
};
