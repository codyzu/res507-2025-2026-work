import { test } from "node:test";
import assert from "node:assert/strict";
import { buildApp } from "../app.js";

test("GET /health returns 200 and ok: true", async () => {
  const app = await buildApp();
  try {
    const res = await app.inject({ method: "GET", url: "/health" });
    assert.equal(res.statusCode, 200);
    assert.equal(res.json().ok, true);
  } finally {
    await app.close();
  }
});

test("unknown route returns 404", async () => {
  const app = await buildApp();
  try {
    const res = await app.inject({ method: "GET", url: "/does-not-exist" });
    assert.equal(res.statusCode, 404);
  } finally {
    await app.close();
  }
});