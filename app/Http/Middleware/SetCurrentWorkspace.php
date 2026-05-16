<?php

namespace App\Http\Middleware;

use App\Models\Workspace;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class SetCurrentWorkspace
{
    public function handle(Request $request, Closure $next): Response
    {
        $workspace = $request->route('workspace');

        if (! $workspace instanceof Workspace) {
            $workspace = Workspace::findOrFail($workspace);
        }

        if (! $workspace->members()->where('user_id', $request->user()->id)->exists()) {
            abort(403);
        }

        app()->instance('current.workspace', $workspace);

        return $next($request);
    }
}
