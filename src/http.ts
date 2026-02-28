import express, { Request, Response, NextFunction } from "express";
import { randomUUID } from "node:crypto";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";

interface HttpServerOptions {
  port: number;
  host: string;
  apiKey?: string;
}

export async function startHttpServer(
  createServer: () => McpServer,
  options: HttpServerOptions
): Promise<void> {
  const { port, host, apiKey } = options;
  const app = express();

  app.use(express.json());

  // Health check
  app.get("/health", (_req: Request, res: Response) => {
    res.json({ status: "ok", server: "splynx-addons-mcp", version: "1.0.0" });
  });

  // Optional API key authentication middleware
  if (apiKey) {
    app.use("/mcp", (req: Request, res: Response, next: NextFunction) => {
      const authHeader = req.headers.authorization;
      if (!authHeader) {
        res.status(401).json({ error: "Authorization header required" });
        return;
      }

      const token = authHeader.startsWith("Bearer ")
        ? authHeader.slice(7)
        : authHeader;

      if (token !== apiKey) {
        res.status(403).json({ error: "Invalid API key" });
        return;
      }

      next();
    });
  }

  // Track active transports by session ID
  const transports = new Map<string, StreamableHTTPServerTransport>();

  // Handle MCP requests (POST /mcp)
  app.post("/mcp", async (req: Request, res: Response) => {
    const sessionId = req.headers["mcp-session-id"] as string | undefined;

    if (sessionId && transports.has(sessionId)) {
      // Existing session
      const transport = transports.get(sessionId)!;
      await transport.handleRequest(req, res, req.body);
      return;
    }

    if (sessionId && !transports.has(sessionId)) {
      // Invalid session
      res.status(404).json({
        jsonrpc: "2.0",
        error: { code: -32000, message: "Session not found" },
        id: null,
      });
      return;
    }

    // New session - create server + transport
    const transport = new StreamableHTTPServerTransport({
      sessionIdGenerator: () => randomUUID(),
    });

    const server = createServer();

    transport.onclose = () => {
      if (transport.sessionId) {
        transports.delete(transport.sessionId);
      }
    };

    await server.connect(transport);

    if (transport.sessionId) {
      transports.set(transport.sessionId, transport);
    }

    await transport.handleRequest(req, res, req.body);
  });

  // Handle SSE streams (GET /mcp)
  app.get("/mcp", async (req: Request, res: Response) => {
    const sessionId = req.headers["mcp-session-id"] as string | undefined;

    if (!sessionId || !transports.has(sessionId)) {
      res.status(400).json({ error: "Invalid or missing session ID" });
      return;
    }

    const transport = transports.get(sessionId)!;
    await transport.handleRequest(req, res);
  });

  // Handle session termination (DELETE /mcp)
  app.delete("/mcp", async (req: Request, res: Response) => {
    const sessionId = req.headers["mcp-session-id"] as string | undefined;

    if (!sessionId || !transports.has(sessionId)) {
      res.status(404).json({ error: "Session not found" });
      return;
    }

    const transport = transports.get(sessionId)!;
    await transport.close();
    transports.delete(sessionId);
    res.status(204).end();
  });

  app.listen(port, host, () => {
    console.log(`Splynx Addons MCP Server (HTTP) running at http://${host}:${port}`);
    console.log(`MCP endpoint: http://${host}:${port}/mcp`);
    console.log(`Health check: http://${host}:${port}/health`);
    if (apiKey) {
      console.log(`Authentication: Bearer token required`);
    } else {
      console.log(`Authentication: NONE (use --api-key=<key> to enable)`);
    }
  });

  // Graceful shutdown
  const cleanup = async () => {
    console.log("\nShutting down...");
    for (const [id, transport] of transports) {
      await transport.close();
      transports.delete(id);
    }
    process.exit(0);
  };

  process.on("SIGINT", cleanup);
  process.on("SIGTERM", cleanup);
}
