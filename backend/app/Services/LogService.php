<?php

namespace App\Services;

use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Throwable;

class LogService
{
    /**
     * Write a structured log message with optional context.
     *
     * @param string $message
     * @param string $level ['info', 'error', 'warning', 'debug', 'notice']
     * @param Request|null $request
     * @param array $context
     * @param string|null $channel
     * @return void
     */
    public function write(
        string $message,
        string $level = 'info',
        ?Request $request = null,
        array $context = [],
        ?string $channel = null
    ): void {
        $user = Auth::user();

        $standardContext = [
            'correlation_id' => $this->getCorrelationId(),
            'user_id'        => $user->UserId ?? null,
            'email'          => $user->Email ?? null,
            'ip_address'     => $request?->ip(),
            'user_agent'     => $request?->header('User-Agent'),
            'route'          => $request?->route()?->getName(),
            'method'         => $request?->method(),
            'url'            => $request?->fullUrl(),
        ];

        $fullContext = array_merge($standardContext, $context);
        $logChannel = $channel ?? 'payslip_daily';

        Log::channel($logChannel)->{$level}($message, $fullContext);
    }

    /**
     * Shortcut to log an exception with standardized format.
     *
     * @param Throwable $e
     * @param string $message
     * @param Request|null $request
     * @param array $extra
     * @param string|null $channel
     * @return void
     */
    public function exception(
        Throwable $e,
        string $message = 'An exception occurred',
        ?Request $request = null,
        array $extra = [],
        ?string $channel = null
    ): void {
        $context = array_merge([
            'error_message' => $e->getMessage(),
            'file'          => $e->getFile(),
            'line'          => $e->getLine(),
            'trace'         => Str::limit($e->getTraceAsString(), 2000),
        ], $extra);

        $this->write($message, 'error', $request, $context, $channel);
    }

    /**
     * Generate or retrieve the current correlation ID.
     *
     * @return string
     */
    protected function getCorrelationId(): string
    {
        if (!app()->bound('correlation_id')) {
            app()->instance('correlation_id', (string) Str::uuid());
        }

        return app()->make('correlation_id');
    }
}
