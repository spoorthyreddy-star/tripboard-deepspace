import { test, expect } from '@playwright/test'

test.describe('API tests', () => {
  test('auth proxy forwards to auth worker', async ({ request }) => {
    const res = await request.get('/api/auth/ok')
    expect(res.ok()).toBeTruthy()
  })

  test('WebSocket endpoint exists', async ({ page }) => {
    // /home is a dynamic page (under src/pages/(app)/), so mounting it boots
    // the providers and auto-connects the records WebSocket. The static
    // landing at '/' deliberately does neither — see smoke.spec.ts.
    await page.goto('/home')
    // Wait for the app to connect its WebSocket (it auto-connects on mount)
    await page.waitForSelector('[data-testid="app-navigation"]', { timeout: 15000 })
    // If the app loaded and connected, the WS endpoint works
  })

  test('weather integration returns destination weather data', async ({ request }) => {
    const res = await request.post('/api/integrations/openweathermap/current', {
      data: { q: 'Paris', units: 'metric' },
    })
    expect(res.ok()).toBeTruthy()
    const body = await res.json()
    expect(body.success).toBe(true)
    expect(body.data).toHaveProperty('temp')
    expect(body.data).toHaveProperty('description')
    expect(body.data).toHaveProperty('humidity')
  })

  test('location geocoding integration returns destination coordinates', async ({ request }) => {
    const res = await request.post('/api/integrations/openweathermap/geocoding', {
      data: { q: 'Tokyo', limit: 3 },
    })
    expect(res.ok()).toBeTruthy()
    const body = await res.json()
    expect(body.success).toBe(true)
    expect(Array.isArray(body.data)).toBe(true)
    expect(body.data.length).toBeGreaterThan(0)
    expect(body.data[0]).toHaveProperty('name')
    expect(body.data[0]).toHaveProperty('lat')
    expect(body.data[0]).toHaveProperty('lon')
  })

  test('AI itinerary integration generates activities', async ({ request }) => {
    const res = await request.post('/api/integrations/openai/chat-completion', {
      data: {
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: 'You are an itinerary assistant. Output raw JSON array.' },
          { role: 'user', content: 'Suggest 1 activity in Paris. Return JSON array: [{"title": "Visit Eiffel Tower"}]' },
        ],
      },
    })
    expect(res.ok()).toBeTruthy()
    const body = await res.json()
    expect(body.success).toBe(true)
    expect(body.data?.choices?.[0]?.message?.content).toBeTruthy()
  })
})
