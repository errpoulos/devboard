<?php

use App\Http\Controllers\Api\V1\AuthController;
use App\Http\Controllers\Api\V1\OrganizationController;
use App\Http\Controllers\Api\V1\UserController;
use Illuminate\Support\Facades\Route;

Route::prefix('v1')->group(function () {
    Route::post('auth/login', [AuthController::class, 'login']);

    Route::middleware('auth:sanctum')->group(function () {
        Route::get('auth/me', [AuthController::class, 'me']);
        Route::post('auth/logout', [AuthController::class, 'logout']);

        Route::middleware('super_admin')->group(function () {
            Route::apiResource('organizations', OrganizationController::class)
                ->only(['index', 'show', 'update', 'destroy']);

            Route::apiResource('users', UserController::class)
                ->only(['index', 'update', 'destroy']);
        });
    });
});
