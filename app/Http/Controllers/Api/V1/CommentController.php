<?php

namespace App\Http\Controllers\Api\V1;

use App\DTOs\StoreCommentDTO;
use App\Http\Controllers\Controller;
use App\Http\Requests\StoreCommentRequest;
use App\Http\Resources\CommentResource;
use App\Models\Board;
use App\Models\Comment;
use App\Models\Task;
use App\Models\Workspace;
use App\Services\CommentService;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\ResourceCollection;
use Illuminate\Http\Response;

class CommentController extends Controller
{
    public function __construct(private readonly CommentService $commentService) {}

    public function index(Request $request, Workspace $workspace, Board $board, Task $task): ResourceCollection
    {
        $comments = $task->comments()->with('user')->cursorPaginate(25);

        return CommentResource::collection($comments);
    }

    public function store(StoreCommentRequest $request, Workspace $workspace, Board $board, Task $task): CommentResource
    {
        $comment = $this->commentService->create(
            task: $task,
            data: StoreCommentDTO::fromRequest($request),
            actor: $request->user(),
        );

        return new CommentResource($comment->load('user'));
    }

    public function destroy(Request $request, Workspace $workspace, Board $board, Task $task, Comment $comment): Response
    {
        $this->authorize('delete', $comment);

        $this->commentService->delete($comment);

        return response()->noContent();
    }
}
