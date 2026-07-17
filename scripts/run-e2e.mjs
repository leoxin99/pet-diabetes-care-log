import { spawn } from "node:child_process";
import { resolve } from "node:path";

const server = spawn(process.execPath, [
  resolve("node_modules/vite/bin/vite.js"),
  "--host",
  "127.0.0.1",
  "--force",
], {
  cwd: process.cwd(),
  stdio: ["ignore", "ignore", "inherit"],
});

async function waitForServer() {
  for (let attempt = 0; attempt < 40; attempt += 1) {
    try {
      const response = await fetch("http://127.0.0.1:5173");
      if (response.ok) return;
    } catch {}
    await new Promise((resolveTimeout) => setTimeout(resolveTimeout, 250));
  }
  throw new Error("Vite 测试服务器启动超时");
}

async function stopServer() {
  if (!server.pid) return;
  if (process.platform === "win32") {
    const taskkill = resolve(process.env.SystemRoot || "C:\\Windows", "System32", "taskkill.exe");
    const killer = spawn(taskkill, ["/pid", String(server.pid), "/T", "/F"], {
      stdio: "ignore",
    });
    await Promise.race([
      new Promise((resolveExit) => {
        killer.on("exit", resolveExit);
        killer.on("error", resolveExit);
      }),
      new Promise((resolveTimeout) => setTimeout(resolveTimeout, 2000)),
    ]);
    killer.unref();
    server.unref();
    return;
  }
  server.kill("SIGTERM");
  await Promise.race([
    new Promise((resolveExit) => server.on("exit", resolveExit)),
    new Promise((resolveTimeout) => setTimeout(resolveTimeout, 2000)),
  ]);
  if (server.exitCode === null) server.kill("SIGKILL");
  server.unref();
}

try {
  await waitForServer();
  const runner = spawn(process.execPath, [
    resolve("node_modules/@playwright/test/cli.js"),
    "test",
    "--reporter=line",
  ], {
    cwd: process.cwd(),
    stdio: "inherit",
    env: { ...process.env, PLAYWRIGHT_EXTERNAL_SERVER: "1" },
  });
  const exitCode = await new Promise((resolveExit) => runner.on("exit", (code) => resolveExit(code ?? 1)));
  process.exitCode = exitCode;
} finally {
  await stopServer();
}
