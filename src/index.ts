#!/usr/bin/env node

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { registerTools } from "./tools.js";
import { registerResources } from "./resources.js";
import { registerPrompts } from "./prompts.js";

function createServer(): McpServer {
  const server = new McpServer({
    name: "splynx-addons",
    version: "1.0.0",
  });

  registerResources(server);
  registerTools(server);
  registerPrompts(server);

  return server;
}

async function main() {
  const args = process.argv.slice(2);

  if (args.includes("--http")) {
    const { startHttpServer } = await import("./http.js");
    const port = parseInt(
      args.find((a) => a.startsWith("--port="))?.split("=")[1] || "3000",
      10
    );
    const host = args.find((a) => a.startsWith("--host="))?.split("=")[1] || "0.0.0.0";

    await startHttpServer(createServer, { port, host });
  } else {
    const { StdioServerTransport } = await import(
      "@modelcontextprotocol/sdk/server/stdio.js"
    );
    const server = createServer();
    const transport = new StdioServerTransport();
    await server.connect(transport);
  }
}

main().catch((error) => {
  console.error("Server error:", error);
  process.exit(1);
});
