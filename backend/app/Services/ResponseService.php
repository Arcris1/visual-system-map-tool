<?php

namespace App\Services;

use Illuminate\Http\JsonResponse;
use Illuminate\Http\Response;

class ResponseService
{
    /**
     * Return a success JSON response.
     */
    public function success(string $message, int $status = Response::HTTP_OK, $data = []): JsonResponse
    {
        if (empty($data)) {
            return response()->json([
                'status' => true,
                'message' => $message
            ], $status);
        }

        return response()->json([
            'status' => true,
            'message' => $message,
            'data' => $data
        ], $status);
    }

    /**
     * Return an error JSON response.
     */
    public function error(string $message, int $status = Response::HTTP_INTERNAL_SERVER_ERROR, array $data = []): JsonResponse
    {

        if (!empty($data)) {
            return response()->json([
                'status' => false,
                'message' => $message,
                'data' => $data
            ], $status);
        }

        return response()->json([
            'status' => false,
            'message' => $message
        ], $status);
    }
}
