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

    /**
     * Regression: routes/web.php is empty, so there is no named `login` route.
     * Laravel's default `redirectGuestsTo(fn () => route('login'))` made every
     * unauthenticated request that did not ask for JSON fail with a 500
     * RouteNotFoundException instead of a 401. Browsers and axios always send
     * `Accept: application/json`, so this only bit plain curl clients, but an
     * API-only backend must never attempt an HTML login redirect.
     */
    public function test_unauthenticated_api_request_without_accept_header_returns_json_401(): void
    {
        $response = $this->get('/api/business-units');

        $response->assertStatus(401)
            ->assertHeader('content-type', 'application/json')
            ->assertJson(['error' => 'unauthenticated']);
    }

    public function test_unauthenticated_api_request_asking_for_html_is_not_redirected(): void
    {
        $response = $this->get('/api/business-units', ['Accept' => 'text/html']);

        $response->assertStatus(401)
            ->assertJson(['error' => 'unauthenticated']);

        $this->assertFalse($response->isRedirect(), 'API must never redirect guests to a login page.');
    }
}
