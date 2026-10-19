import test from 'node:test';
import assert from 'node:assert';
import { buildApp } from '../app.js';

test('GET /health renvoie un statut 200 et ok: true', async () => {
  const app = await buildApp();
  
  const response = await app.inject({
    method: 'GET',
    url: '/health'
  });

  assert.strictEqual(response.statusCode, 200);
  assert.deepStrictEqual(JSON.parse(response.payload), { ok: true });
  
  await app.close();
});

test('GET /route-inconnue renvoie un statut 404', async () => {
  const app = await buildApp();
  
  const response = await app.inject({
    method: 'GET',
    url: '/route-inexistante-pour-test'
  });

  assert.strictEqual(response.statusCode, 404);
  
  await app.close();
});