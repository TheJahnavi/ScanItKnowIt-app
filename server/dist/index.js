import express from "express";
import { registerRoutes } from "./routes.js";
import { setupVite, serveStatic, log } from "./vite.js";
import path from "path";
const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use((req, res, next) => {
    const start = Date.now();
    const path = req.path;
    let capturedJsonResponse = undefined;
    const originalResJson = res.json;
    res.json = function (bodyJson, ...args) {
        capturedJsonResponse = bodyJson;
        return originalResJson.apply(res, [bodyJson, ...args]);
    };
    res.on("finish", () => {
        const duration = Date.now() - start;
        if (path.startsWith("/api")) {
            let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
            if (capturedJsonResponse) {
                logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
            }
            if (logLine.length > 80) {
                logLine = logLine.slice(0, 79) + "…";
            }
            log(logLine);
        }
    });
    next();
});
registerRoutes(app);
if (process.env.NODE_ENV === "production") {
    const distPath = path.resolve(__dirname, "..", "client", "dist");
    app.use(express.static(distPath));
    app.get("*", (_req, res) => {
        res.sendFile(path.resolve(distPath, "index.html"));
    });
}
app.use((err, _req, res, _next) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";
    res.status(status).json({ message });
    throw err;
});
export default app;
if (process.env.NODE_ENV !== "production") {
    (async () => {
        if (app.get("env") === "development") {
            const server = await registerRoutes(app);
            if (server) {
                await setupVite(app, server);
            }
        }
        else {
            serveStatic(app);
        }
        const port = parseInt(process.env.PORT || '3001', 10);
        const http = require('http');
        const server = http.createServer(app);
        server.listen({
            port,
            host: "127.0.0.1",
            reusePort: false,
        }, () => {
            log(`serving on http://127.0.0.1:${port}`);
        });
    })();
}
