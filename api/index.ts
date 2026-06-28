import type { Request, Response } from "express";

// Dynamic import avoids top-level await at the Vercel entry level.
// If server/index.ts crashes during init, we get a real error message back
// instead of the generic "FUNCTION_INVOCATION_FAILED" page.
let appPromise: Promise<any> | null = null;

function getApp() {
  if (!appPromise) {
    appPromise = import("../server/index.js")
      .then((m) => m.app ?? m.default)
      .catch((err) => {
        // Reset so the next request retries init
        appPromise = null;
        throw err;
      });
  }
  return appPromise;
}

export default async function handler(req: Request, res: Response) {
  try {
    const app = await getApp();
    app(req, res);
  } catch (err: any) {
    console.error("Vercel handler init error:", err);
    res.status(500).json({
      error: "Server initialization failed",
      detail: err?.message ?? String(err),
      stack: process.env.NODE_ENV !== "production" ? err?.stack : undefined,
    });
  }
}
