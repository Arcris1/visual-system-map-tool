<?php

namespace App\Traits;

use App\Services\LogService;

trait HasLogService
{
    protected LogService $logService;

    public function logService(): LogService
    {
        return app(LogService::class);
    }
}
