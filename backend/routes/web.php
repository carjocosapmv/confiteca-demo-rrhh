<?php

use Illuminate\Support\Facades\Route;

Route::fallback(function () {
    return response()->file(public_path('index.html'));
});
