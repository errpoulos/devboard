<?php

use App\Http\Controllers\Api\V1\AgentController;
use App\Http\Controllers\Api\V1\AuthController;
use App\Http\Controllers\Api\V1\ClientNoteController;
use App\Http\Controllers\Api\V1\CustomerController;
use App\Http\Controllers\Api\V1\RegistrationController;
use App\Http\Controllers\Api\V1\TicketAttachmentController;
use App\Http\Controllers\Api\V1\TicketController;
use App\Http\Controllers\Api\V1\TicketReplyController;
use App\Http\Controllers\Api\V1\UserController;
use Illuminate\Support\Facades\Route;

Route::prefix('v1')->group(function () {
    Route::post('auth/login', [AuthController::class, 'login']);
    Route::post('auth/register', [RegistrationController::class, 'store']);

    Route::middleware('auth:sanctum')->group(function () {
        Route::get('auth/me', [AuthController::class, 'me']);
        Route::post('auth/logout', [AuthController::class, 'logout']);

        Route::apiResource('tickets', TicketController::class);

        Route::get('tickets/{ticket}/replies', [TicketReplyController::class, 'index']);
        Route::post('tickets/{ticket}/replies', [TicketReplyController::class, 'store']);

        Route::get('tickets/{ticket}/attachments', [TicketAttachmentController::class, 'index']);
        Route::post('tickets/{ticket}/attachments', [TicketAttachmentController::class, 'store']);
        Route::get('tickets/{ticket}/attachments/{attachment}/download', [TicketAttachmentController::class, 'download']);
        Route::delete('tickets/{ticket}/attachments/{attachment}', [TicketAttachmentController::class, 'destroy']);

        // Client notes — agents only
        Route::get('/users/{user}/notes', [ClientNoteController::class, 'indexForUser']);
        Route::post('/users/{user}/notes', [ClientNoteController::class, 'storeForUser']);
        Route::get('/orgs/{org}/notes', [ClientNoteController::class, 'indexForOrg']);
        Route::post('/orgs/{org}/notes', [ClientNoteController::class, 'storeForOrg']);
        Route::patch('/notes/{note}', [ClientNoteController::class, 'update']);
        Route::delete('/notes/{note}', [ClientNoteController::class, 'destroy']);

        // Agents list (for assignment dropdown)
        Route::get('/agents', [UserController::class, 'agents']);

        // Team management (admin only)
        Route::get('/team', [AgentController::class, 'index']);
        Route::post('/team', [AgentController::class, 'store']);
        Route::patch('/team/{user}', [AgentController::class, 'update']);
        Route::delete('/team/{user}', [AgentController::class, 'destroy']);

        // Customers — agent/admin only
        Route::get('/customers', [CustomerController::class, 'index']);
        Route::get('/customers/{user}', [CustomerController::class, 'show']);

        // CRM summary for a customer (declared before /users/{user} to prevent route shadowing)
        Route::get('/users/{user}/crm-summary', [CustomerController::class, 'crmSummary']);

        // Customer profile
        Route::get('/users/{user}', [UserController::class, 'show']);
    });
});
