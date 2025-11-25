<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Traits\HasResponseService;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;

class AuthController extends Controller
{
    use HasResponseService;

    /**
     * Register a new user
     */
    public function register(Request $request): JsonResponse
    {
        try {
            $validated = $request->validate([
                'name' => 'required|string|max:255',
                'email' => 'required|string|email|max:255|unique:users',
                'password' => 'required|string|min:8|confirmed',
            ]);

            $user = User::create([
                'name' => $validated['name'],
                'email' => $validated['email'],
                'password' => Hash::make($validated['password']),
            ]);

            // Create Sanctum token
            $token = $user->createToken('auth_token')->plainTextToken;

            return $this->responseService()->success(
                'User registered successfully',
                201,
                [
                    'user' => [
                        'id' => $user->id,
                        'name' => $user->name,
                        'email' => $user->email,
                    ],
                    'token' => $token,
                ]
            );
        } catch (ValidationException $e) {
            return $this->responseService()->error('Validation failed', 422, $e->errors());
        } catch (\Exception $e) {
            return $this->responseService()->error('Registration failed: ' . $e->getMessage(), 500);
        }
    }

    /**
     * Login user and return token
     */
    public function login(Request $request): JsonResponse
    {
        try {
            $validated = $request->validate([
                'email' => 'required|string|email',
                'password' => 'required|string',
            ]);

            $user = User::where('email', $validated['email'])->first();

            if (!$user || !Hash::check($validated['password'], $user->password)) {
                return $this->responseService()->error('Invalid credentials', 401);
            }

            // Revoke all previous tokens
            $user->tokens()->delete();

            // Create new token
            $token = $user->createToken('auth_token')->plainTextToken;

            return $this->responseService()->success(
                'Login successful',
                200,
                [
                    'user' => [
                        'id' => $user->id,
                        'name' => $user->name,
                        'email' => $user->email,
                    ],
                    'token' => $token,
                ]
            );
        } catch (ValidationException $e) {
            return $this->responseService()->error('Validation failed', 422, $e->errors());
        } catch (\Exception $e) {
            return $this->responseService()->error('Login failed: ' . $e->getMessage(), 500);
        }
    }

    /**
     * Logout user (revoke token)
     */
    public function logout(Request $request): JsonResponse
    {
        try {
            // Revoke current user token
            $request->user()->currentAccessToken()->delete();

            return $this->responseService()->success('Logged out successfully');
        } catch (\Exception $e) {
            return $this->responseService()->error('Logout failed: ' . $e->getMessage(), 500);
        }
    }

    /**
     * Get authenticated user info
     */
    public function user(Request $request): JsonResponse
    {
        try {
            $user = $request->user();

            return $this->responseService()->success(
                'User retrieved successfully',
                200,
                [
                    'id' => $user->id,
                    'name' => $user->name,
                    'email' => $user->email,
                    'created_at' => $user->created_at,
                ]
            );
        } catch (\Exception $e) {
            return $this->responseService()->error('Failed to retrieve user: ' . $e->getMessage(), 500);
        }
    }

    /**
     * Refresh token
     */
    public function refresh(Request $request): JsonResponse
    {
        try {
            $user = $request->user();

            // Revoke current token
            $request->user()->currentAccessToken()->delete();

            // Create new token
            $token = $user->createToken('auth_token')->plainTextToken;

            return $this->responseService()->success(
                'Token refreshed successfully',
                200,
                [
                    'token' => $token,
                    'user' => [
                        'id' => $user->id,
                        'name' => $user->name,
                        'email' => $user->email,
                    ],
                ]
            );
        } catch (\Exception $e) {
            return $this->responseService()->error('Token refresh failed: ' . $e->getMessage(), 500);
        }
    }
}
