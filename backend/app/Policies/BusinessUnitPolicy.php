<?php

namespace App\Policies;

use App\Models\User;
use Illuminate\Auth\Access\HandlesAuthorization;

class BusinessUnitPolicy extends BasePolicy
{
    protected function moduleKey(): string
    {
        return 'unidades';
    }
}
