<?php

use App\Http\Controllers\Api\V1\AuthController;
use App\Http\Controllers\Api\V1\TicketController;
use App\Http\Controllers\Api\V1\TicketReplyController;
use Illuminate\Support\Facades\Route;

Route::prefix('v1')->group(function () {
    Route::post('auth/login', [AuthController::class, 'login']);

    Route::middleware('auth:sanctum')->group(function () {
        Route::get('auth/me', [AuthController::class, 'me']);
        Route::post('auth/logout', [AuthController::class, 'logout']);

        Route::apiResource('tickets', TicketController::class);

        Route::get('tickets/{ticket}/replies', [TicketReplyController::class, 'index']);
        Route::post('tickets/{ticket}/replies', [TicketReplyController::class, 'store']);
    });
});
