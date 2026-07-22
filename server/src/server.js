import { randomBytes } from "node:crypto";
import cors from "cors";
import express from "express";
import {
  createUrl,
  getUrl,
  hasShortCode,
  listUrls,
  recordVisit,
} from "./store.js";

const CODE_BYTES = 6;

function isValidUrl(value) {
  if (typeof value !== "string" || value.trim() === "") {
    return false;
  }

  try {
    const parsedUrl = new URL(value);
    return parsedUrl.protocol === "http:" || parsedUrl.protocol === "https:";
  } catch {
    return false;
  }
}

function generateShortCode() {
  let shortCode;

  do {
    shortCode = randomBytes(CODE_BYTES).toString("base64url");
  } while (hasShortCode(shortCode));

  return shortCode;
}

function serializeUrl(record, baseUrl) {
  return {
    ...record,
    shortUrl: `${baseUrl}/${record.shortCode}`,
  };
}

export function createApp({ baseUrl = process.env.BASE_URL || "http://localhost:3000" } = {}) {
  const app = express();
  const normalizedBaseUrl = baseUrl.replace(/\/$/, "");

  app.use(cors());
  app.use(express.json());

  app.use((error, _request, response, next) => {
    if (error instanceof SyntaxError && "body" in error) {
      return response.status(400).json({ error: "Request body must be valid JSON." });
    }

    return next(error);
  });

  app.get("/api/health", (_request, response) => {
    response.status(200).json({ data: { status: "ok" } });
  });

  app.get("/api/urls", (_request, response) => {
    const records = listUrls().map((record) => (
      serializeUrl(record, normalizedBaseUrl)
    ));

    response.status(200).json({ data: records });
  });

  app.post("/api/urls", (request, response) => {
    const { url } = request.body ?? {};

    if (!isValidUrl(url)) {
      return response.status(400).json({
        error: "A valid HTTP or HTTPS URL is required.",
      });
    }

    const record = createUrl({
      shortCode: generateShortCode(),
      originalUrl: url.trim(),
    });

    return response.status(201).json({
      data: serializeUrl(record, normalizedBaseUrl),
    });
  });

  app.get("/api/urls/:shortCode", (request, response) => {
    const record = getUrl(request.params.shortCode);

    if (!record) {
      return response.status(404).json({ error: "Short URL not found." });
    }

    return response.status(200).json({
      data: serializeUrl(record, normalizedBaseUrl),
    });
  });

  app.get("/:shortCode", (request, response) => {
    const record = recordVisit(request.params.shortCode);

    if (!record) {
      return response.status(404).json({ error: "Short URL not found." });
    }

    return response.redirect(302, record.originalUrl);
  });

  app.use((_request, response) => {
    response.status(404).json({ error: "Route not found." });
  });

  return app;
}

export const app = createApp();
