<?php

use App\Http\Controllers\Api\V1\AuthController;
use App\Http\Controllers\Api\V1\BoardColumnController;
use App\Http\Controllers\Api\V1\BoardController;
use App\Http\Controllers\Api\V1\CommentController;
use App\Http\Controllers\Api\V1\TaskController;
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
        Route::apiResource('workspaces', WorkspaceController::class)->only(['index', 'store', 'show', 'destroy']);

        Route::prefix('workspaces/{workspace}')->middleware('workspace')->group(function () {

            // Members
            Route::get('members', [WorkspaceMemberController::class, 'index'])->name('workspaces.members.index');
            Route::post('members/invite', [WorkspaceMemberController::class, 'invite'])->name('workspaces.members.invite');
            Route::delete('members/{member}', [WorkspaceMemberController::class, 'remove'])->name('workspaces.members.remove');

            // Boards
            Route::apiResource('boards', BoardController::class)->only(['index', 'store', 'show', 'destroy']);

            Route::prefix('boards/{board}')->group(function () {
                // Column reorder
                Route::post('columns/reorder', [BoardColumnController::class, 'reorder'])->name('boards.columns.reorder');

                // Tasks
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
