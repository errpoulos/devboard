<?php

namespace App\Services;

use App\DTOs\Auth\LoginDTO;
use App\Models\User;
use Illuminate\Auth\AuthenticationException;
use Illuminate\Support\Facades\Auth;

class AuthService
{
    public function login(LoginDTO $dto): User
    {
        if (! Auth::attempt(['email' => $dto->email, 'password' => $dto->password])) {
            throw new AuthenticationException('Invalid credentials.');
        }

        return Auth::user();
    }

    public function logout(): void
    {
        Auth::guard('web')->logout();
        request()->session()->invalidate();
        request()->session()->regenerateToken();
    }
}
