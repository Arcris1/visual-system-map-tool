<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\DiagramController;
use App\Http\Controllers\Api\AuthController;

// Public routes (no authentication required)
Route::post('/register', [AuthController::class, 'register']);
Route::post('/login', [AuthController::class, 'login']);

// Protected routes (require authentication)
Route::middleware(['auth:sanctum'])->group(function () {
    // Auth routes
    Route::get('/user', [AuthController::class, 'user']);
    Route::post('/logout', [AuthController::class, 'logout']);
    Route::post('/refresh', [AuthController::class, 'refresh']);

    // Diagram routes
    Route::apiResource('diagrams', DiagramController::class);
    Route::post('diagrams/{diagram}/duplicate', [DiagramController::class, 'duplicate'])->name('diagrams.duplicate');
});
