<?php

use App\Http\Controllers\Api\V1\AuthController;
use App\Http\Controllers\Api\V1\CompanyController;
use App\Http\Controllers\Api\V1\ContactController;
use App\Http\Controllers\Api\V1\DealController;
use App\Http\Controllers\Api\V1\PipelineController;
use Illuminate\Support\Facades\Route;

Route::prefix('v1')->group(function () {
    Route::post('auth/login', [AuthController::class, 'login']);

    Route::middleware('auth:sanctum')->group(function () {
        Route::get('auth/me', [AuthController::class, 'me']);
        Route::post('auth/logout', [AuthController::class, 'logout']);

        Route::apiResource('companies', CompanyController::class)->only(['index', 'store', 'destroy']);
        Route::apiResource('contacts', ContactController::class)->only(['index', 'store', 'destroy']);

        Route::get('pipeline', [PipelineController::class, 'index']);

        Route::apiResource('deals', DealController::class)->only(['index', 'store', 'update', 'destroy']);
    });
});
