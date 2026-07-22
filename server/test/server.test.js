import assert from "node:assert/strict";
import { after, before, beforeEach, test } from "node:test";
import { createApp } from "../src/server.js";
import { resetStore } from "../src/store.js";

let listener;
let baseUrl;

before(async () => {
  listener = createApp({ baseUrl: "http://short.test" }).listen(0);
  await new Promise((resolve, reject) => {
    listener.once("listening", resolve);
    listener.once("error", reject);
  });

  const address = listener.address();
  baseUrl = `http://127.0.0.1:${address.port}`;
});

after(async () => {
  await new Promise((resolve, reject) => {
    listener.close((error) => (error ? reject(error) : resolve()));
  });
});

beforeEach(() => {
  resetStore();
});

async function createShortUrl(url = "https://example.com/articles/one") {
  const response = await fetch(`${baseUrl}/api/urls`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ url }),
  });

  return { response, body: await response.json() };
}

test("health endpoint reports that the API is available", async () => {
  const response = await fetch(`${baseUrl}/api/health`);

  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), { data: { status: "ok" } });
});

test("creates a short URL", async () => {
  const originalUrl = "https://example.com/a/long/path?source=test";
  const { response, body } = await createShortUrl(originalUrl);

  assert.equal(response.status, 201);
  assert.equal(body.data.originalUrl, originalUrl);
  assert.match(body.data.shortCode, /^[A-Za-z0-9_-]+$/);
  assert.equal(body.data.shortUrl, `http://short.test/${body.data.shortCode}`);
  assert.equal(Number.isNaN(Date.parse(body.data.createdAt)), false);
});

test("lists the ten most recently created URLs newest first", async () => {
  const createdCodes = [];

  for (let index = 0; index < 12; index += 1) {
    const created = await createShortUrl(`https://example.com/item/${index}`);
    createdCodes.push(created.body.data.shortCode);
  }

  const response = await fetch(`${baseUrl}/api/urls`);
  const body = await response.json();

  assert.equal(response.status, 200);
  assert.equal(body.data.length, 10);
  assert.deepEqual(
    body.data.map((record) => record.shortCode),
    createdCodes.slice(-10).reverse(),
  );
  assert.equal(body.data[0].shortUrl, `http://short.test/${createdCodes.at(-1)}`);
});

test("rejects missing and malformed URLs", async () => {
  for (const requestBody of [{}, { url: "not-a-url" }]) {
    const response = await fetch(`${baseUrl}/api/urls`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(requestBody),
    });

    assert.equal(response.status, 400);
    assert.equal(typeof (await response.json()).error, "string");
  }
});

test("rejects URL protocols other than HTTP and HTTPS", async () => {
  const { response, body } = await createShortUrl("ftp://example.com/file.txt");

  assert.equal(response.status, 400);
  assert.equal(typeof body.error, "string");
});

test("looks up a created short URL", async () => {
  const created = await createShortUrl();
  const response = await fetch(
    `${baseUrl}/api/urls/${created.body.data.shortCode}`,
  );
  const body = await response.json();

  assert.equal(response.status, 200);
  assert.equal(body.data.shortCode, created.body.data.shortCode);
  assert.equal(body.data.originalUrl, created.body.data.originalUrl);
});

test("deletes an existing short URL", async () => {
  const created = await createShortUrl();
  const shortCode = created.body.data.shortCode;
  const response = await fetch(`${baseUrl}/api/urls/${shortCode}`, {
    method: "DELETE",
  });
  const body = await response.json();

  assert.equal(response.status, 200);
  assert.equal(body.data.shortCode, shortCode);
  assert.equal(body.data.originalUrl, created.body.data.originalUrl);

  const lookupResponse = await fetch(`${baseUrl}/api/urls/${shortCode}`);
  assert.equal(lookupResponse.status, 404);
});

test("returns 404 when deleting an unknown short URL", async () => {
  const response = await fetch(`${baseUrl}/api/urls/does-not-exist`, {
    method: "DELETE",
  });

  assert.equal(response.status, 404);
  assert.deepEqual(await response.json(), { error: "Short URL not found." });
});

test("redirects a short code to its original URL", async () => {
  const originalUrl = "https://example.com/destination";
  const created = await createShortUrl(originalUrl);
  const response = await fetch(
    `${baseUrl}/${created.body.data.shortCode}`,
    { redirect: "manual" },
  );

  assert.equal(response.status, 302);
  assert.equal(response.headers.get("location"), originalUrl);
});

test("returns errors for missing short codes", async () => {
  for (const path of ["/api/urls/does-not-exist", "/does-not-exist"]) {
    const response = await fetch(`${baseUrl}${path}`, { redirect: "manual" });

    assert.equal(response.status, 404);
    assert.equal(typeof (await response.json()).error, "string");
  }
});
