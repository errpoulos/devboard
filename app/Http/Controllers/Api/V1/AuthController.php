<?php

namespace App\Http\Controllers\Api\V1;

use App\DTOs\Auth\LoginDTO;
use App\Http\Controllers\Controller;
use App\Http\Requests\Auth\LoginRequest;
use App\Http\Resources\UserResource;
use App\Services\AuthService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AuthController extends Controller
{
    public function __construct(private readonly AuthService $authService) {}

    public function login(LoginRequest $request): UserResource
    {
        $user = $this->authService->login(LoginDTO::fromRequest($request));

        $request->session()->regenerate();

        return new UserResource($user);
    }

    public function logout(Request $request): JsonResponse
    {
        $this->authService->logout();

        return response()->json(['message' => 'Logged out.']);
    }

    public function me(Request $request): UserResource
    {
        return new UserResource($request->user());
    }
}
