<?php

use App\Http\Controllers\Api\V1\AdminController;
use App\Http\Controllers\Api\V1\AuthController;
use App\Http\Controllers\Api\V1\ClientNoteController;
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

        // Admin — user management
        Route::get('admin/users', [AdminController::class, 'index']);
        Route::post('admin/users', [AdminController::class, 'store']);
        Route::patch('admin/users/{user}', [AdminController::class, 'update']);
        Route::delete('admin/users/{user}', [AdminController::class, 'destroy']);

        Route::apiResource('companies', CompanyController::class)->only(['index', 'store', 'destroy']);
        Route::apiResource('contacts', ContactController::class)->only(['index', 'store', 'destroy']);

        Route::get('pipeline', [PipelineController::class, 'index']);

        Route::apiResource('deals', DealController::class)->only(['index', 'store', 'update', 'destroy']);

        // Client notes — sales category
        Route::get('contacts/{contact}/notes', [ClientNoteController::class, 'indexForContact']);
        Route::post('contacts/{contact}/notes', [ClientNoteController::class, 'storeForContact']);
        Route::get('companies/{company}/notes', [ClientNoteController::class, 'indexForCompany']);
        Route::post('companies/{company}/notes', [ClientNoteController::class, 'storeForCompany']);
        Route::patch('notes/{note}', [ClientNoteController::class, 'update']);
        Route::delete('notes/{note}', [ClientNoteController::class, 'destroy']);
    });
});
