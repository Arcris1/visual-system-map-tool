<?php

namespace App\Traits;
use App\Services\ResponseService;

trait HasResponseService
{
    protected ResponseService $responseService;

    public function responseService(): ResponseService
    {
        return app(ResponseService::class);
    }
}
