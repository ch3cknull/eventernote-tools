import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { InMemoryTransport } from "@modelcontextprotocol/sdk/inMemory.js";
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { expect, it, vi } from "vitest";

it("starts the MCP entry point and handles tool listing and calls", async () => {
  const [clientTransport, serverTransport] =
    InMemoryTransport.createLinkedPair();
  const originalConnect = Server.prototype.connect;
  const connect = vi
    .spyOn(Server.prototype, "connect")
    .mockImplementation(function (this: Server) {
      return originalConnect.call(this, serverTransport);
    });
  const client = new Client({ name: "eventernote-test", version: "0.1.0" });

  try {
    await import("../src/server.js");
    await client.connect(clientTransport);

    const result = await client.listTools();
    expect(result.tools.map((tool) => tool.name)).toEqual(
      expect.arrayContaining(["event_search", "event_detail"]),
    );

    const call = await client.callTool({
      name: "preferences_import_favorites",
      arguments: { dbPath: ":memory:", dryRun: true },
    });
    expect(call).toMatchObject({
      content: [
        { type: "text", text: expect.stringContaining('"imported":0') },
      ],
    });
  } finally {
    await client.close();
    await serverTransport.close();
    connect.mockRestore();
  }
});
