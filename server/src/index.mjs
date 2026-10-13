import { createServer } from "node:http";

const port = Number(process.env.PORT ?? 4000);
const send = (response, status, body) => {
  response.writeHead(status, { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Headers": "Content-Type, Authorization", "Content-Type": "application/json" });
  response.end(JSON.stringify(body));
};

const server = createServer((request, response) => {
  if (request.method === "OPTIONS") { response.writeHead(204, { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Headers": "Content-Type, Authorization" }); response.end(); return; }
  if (request.method === "GET" && request.url === "/api/health") { send(response, 200, { status: "ok", service: "retain-api", version: "0.1.0" }); return; }
  send(response, 404, { error: "Route not found", code: "NOT_FOUND" });
});

server.listen(port, () => console.log(`Retain API foundation listening on http://localhost:${port}`));
