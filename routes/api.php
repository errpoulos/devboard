<?php

use App\Http\Controllers\Api\V1\AuthController;
use App\Http\Controllers\Api\V1\BoardColumnController;
use App\Http\Controllers\Api\V1\BoardController;
use App\Http\Controllers\Api\V1\BoardImportController;
use App\Http\Controllers\Api\V1\CommentController;
use App\Http\Controllers\Api\V1\TaskController;
use App\Http\Controllers\Api\V1\TaskImportController;
use App\Http\Controllers\Api\V1\TaskReorderController;
use App\Http\Controllers\Api\V1\WorkspaceController;
use App\Http\Controllers\Api\V1\WorkspaceMemberController;
use Illuminate\Support\Facades\Route;

Route::prefix('v1')->group(function () {

    // Auth
    Route::post('auth/login', [AuthController::class, 'login'])->name('auth.login');

    Route::middleware('auth:sanctum')->group(function () {
        Route::post('auth/logout', [AuthController::class, 'logout'])->name('auth.logout');
        Route::get('auth/me', [AuthController::class, 'me'])->name('auth.me');

        // Workspaces
        Route::apiResource('workspaces', WorkspaceController::class)->only(['index', 'store', 'show', 'update', 'destroy']);

        Route::prefix('workspaces/{workspace}')->middleware('workspace')->group(function () {

            // Members
            Route::get('members', [WorkspaceMemberController::class, 'index'])->name('workspaces.members.index');
            Route::post('members/invite', [WorkspaceMemberController::class, 'invite'])->name('workspaces.members.invite');
            Route::delete('members/{member}', [WorkspaceMemberController::class, 'remove'])->name('workspaces.members.remove');

            // Boards
            Route::post('boards/import', [BoardImportController::class, 'store'])->name('boards.import');
            Route::apiResource('boards', BoardController::class)->only(['index', 'store', 'show', 'destroy']);

            Route::prefix('boards/{board}')->group(function () {
                // Columns
                Route::post('columns', [BoardColumnController::class, 'store'])->name('boards.columns.store');
                Route::patch('columns/{column}', [BoardColumnController::class, 'update'])->name('boards.columns.update');
                Route::delete('columns/{column}', [BoardColumnController::class, 'destroy'])->name('boards.columns.destroy');
                Route::post('columns/reorder', [BoardColumnController::class, 'reorder'])->name('boards.columns.reorder');

                // Tasks
                Route::post('tasks/import', [TaskImportController::class, 'store'])->name('tasks.import');
                Route::apiResource('tasks', TaskController::class)->only(['index', 'store', 'show', 'update', 'destroy']);
                Route::post('tasks/reorder', TaskReorderController::class)->name('tasks.reorder');

                // Comments
                Route::prefix('tasks/{task}')->group(function () {
                    Route::get('comments', [CommentController::class, 'index'])->name('tasks.comments.index');
                    Route::post('comments', [CommentController::class, 'store'])->name('tasks.comments.store');
                    Route::delete('comments/{comment}', [CommentController::class, 'destroy'])->name('tasks.comments.destroy');
                });
            });
        });
    });
});
