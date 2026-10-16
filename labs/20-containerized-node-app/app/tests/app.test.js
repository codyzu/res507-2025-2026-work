import { test } from 'node:test'
import assert from 'node:assert'
import { buildApp } from '../app.js'


test('Test des routes de l’application', async (t) => {
  let app;
  
  try {
    app = await buildApp();

    await t.test('Route /health retourne 200 et le bon JSON', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/health'
      });
      
      assert.strictEqual(response.statusCode, 200);
      assert.deepStrictEqual(response.json(), { ok: true });
    });

    await t.test('Route inconnue retourne une erreur 404', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/route-inexistante'
      });
      
      assert.strictEqual(response.statusCode, 404);
    });

  } finally {
    if (app) {
      await app.close();
    }
  }
});
