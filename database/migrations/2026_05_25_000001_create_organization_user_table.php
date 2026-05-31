<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('organization_user', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('organization_id');
            $table->unsignedBigInteger('user_id');
            $table->foreign('organization_id')->references('id')->on('organizations')->cascadeOnDelete();
            $table->foreign('user_id')->references('id')->on('users')->cascadeOnDelete();
            $table->unique(['organization_id', 'user_id']);
            $table->timestamps();
        });

        // Populate from existing users.organization_id
        DB::table('users')
            ->whereNotNull('organization_id')
            ->select('id', 'organization_id')
            ->chunkById(500, function ($users) {
                $rows = $users->map(fn($u) => [
                    'organization_id' => $u->organization_id,
                    'user_id' => $u->id,
                    'created_at' => now(),
                    'updated_at' => now(),
                ])->toArray();

                DB::table('organization_user')->insertOrIgnore($rows);
            });
    }

    public function down(): void
    {
        Schema::dropIfExists('organization_user');
    }
};
