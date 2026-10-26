#!/usr/bin/env node
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { CallToolRequestSchema, ListToolsRequestSchema } from "@modelcontextprotocol/sdk/types.js";
import { createEventernoteTools } from "./tools.js";

const server = new Server({ name: "eventernote-mcp", version: "0.1.0" }, { capabilities: { tools: {} } });
const tools = createEventernoteTools();

server.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools: Object.keys(tools).map((name) => ({ name, description: `Eventernote ${name}`, inputSchema: { type: "object" } })),
}));

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const fn = (tools as Record<string, (input: unknown) => Promise<unknown>>)[request.params.name];
  if (!fn) throw new Error(`Unknown tool: ${request.params.name}`);
  const result = await fn(request.params.arguments ?? {});
  return { content: [{ type: "text", text: JSON.stringify(result) }] };
});

await server.connect(new StdioServerTransport());
