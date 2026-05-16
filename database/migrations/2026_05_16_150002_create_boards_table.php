<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('boards', function (Blueprint $table) {
            $table->bigIncrements('id');
            $table->bigInteger('workspace_id')->unsigned();
            $table->string('name');
            $table->text('description')->nullable();
            $table->timestamps();

            $table->foreign('workspace_id')->references('id')->on('workspaces')->cascadeOnDelete();
        });

        Schema::create('board_columns', function (Blueprint $table) {
            $table->bigIncrements('id');
            $table->bigInteger('board_id')->unsigned();
            $table->string('name');
            $table->unsignedInteger('position')->default(0);
            $table->string('color', 7)->nullable();
            $table->timestamps();

            $table->foreign('board_id')->references('id')->on('boards')->cascadeOnDelete();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('board_columns');
        Schema::dropIfExists('boards');
    }
};
