<?php

namespace Tests\Feature;

use Tests\TestCase;

/**
 * Smoke tests for the API-only contract.
 *
 * This backend serves no web routes: the SPA is deployed separately (Vercel).
 * The stale stock assertion of `GET /` returning 200 was removed when the SPA
 * fallback route was dropped, because it masked genuine API 404s.
 */
class ExampleTest extends TestCase
{
    public function test_health_endpoint_returns_a_successful_response(): void
    {
        $this->get('/up')->assertStatus(200);
    }

    public function test_root_is_not_served_because_backend_is_api_only(): void
    {
        $this->get('/')->assertStatus(404);
    }

    public function test_unknown_api_routes_return_a_json_not_found(): void
    {
        $this->getJson('/api/this-route-does-not-exist')
            ->assertStatus(404)
            ->assertJson(['error' => 'not_found']);
    }
}
