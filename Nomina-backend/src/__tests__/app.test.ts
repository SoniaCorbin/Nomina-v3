import request from 'supertest';
import app from '../app';

describe('Backend HTTP smoke tests', () => {
  it('GET / returns 200 and running message', async () => {
    const response = await request(app).get('/');

    expect(response.status).toBe(200);
    expect(response.text).toContain('Nomina-backend running');
  });

  it('GET /healthz returns 200 and expected payload', async () => {
    const response = await request(app).get('/healthz');

    expect(response.status).toBe(200);
    expect(response.body).toEqual({ ok: true });
  });

  it('GET /api/unknown-route returns 404', async () => {
    const response = await request(app).get('/api/unknown-route');

    expect(response.status).toBe(404);
  });

  it('GET /unknown-route returns 404', async () => {
    const response = await request(app).get('/unknown-route');

    expect(response.status).toBe(404);
  });

  it('OPTIONS /healthz responds with CORS headers', async () => {
    const response = await request(app)
      .options('/healthz')
      .set('Origin', 'http://localhost:5173')
      .set('Access-Control-Request-Method', 'GET');

    expect(response.status).toBe(204);
    expect(response.headers['access-control-allow-origin']).toBeDefined();
  });

  it('GET /healthz responds with JSON content-type', async () => {
    const response = await request(app).get('/healthz');

    expect(response.headers['content-type']).toMatch(/application\/json/);
  });
});
