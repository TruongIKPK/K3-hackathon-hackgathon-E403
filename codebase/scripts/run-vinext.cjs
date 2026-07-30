const { existsSync } = require("node:fs");
const { join } = require("node:path");
const { spawnSync } = require("node:child_process");

const command = process.argv[2] || "dev";
const projectRoot = join(__dirname, "..");
const cli = join(projectRoot, "node_modules", "vinext", "dist", "cli.js");

function isCompatible(version) {
  const [major, minor] = version.replace(/^v/, "").split(".").map(Number);
  return major > 22 || (major === 22 && minor >= 13);
}

function bundledNode() {
  if (process.platform !== "win32" || !process.env.USERPROFILE) return null;
  const candidate = join(
    process.env.USERPROFILE,
    ".cache",
    "codex-runtimes",
    "codex-primary-runtime",
    "dependencies",
    "node",
    "bin",
    "node.exe",
  );
  return existsSync(candidate) ? candidate : null;
}

const runtime = isCompatible(process.version)
  ? process.execPath
  : process.env.VINEXT_NODE || bundledNode();

if (!runtime) {
  console.error(
    `Freehand Slide Lab requires Node.js >=22.13.0 (current: ${process.version}).\n` +
      "Install Node 22 LTS/24, or set VINEXT_NODE to a compatible Node executable.",
  );
  process.exit(1);
}

const result = spawnSync(runtime, [cli, command], {
  cwd: projectRoot,
  env: process.env,
  stdio: "inherit",
});

if (result.error) {
  console.error(result.error.message);
  process.exit(1);
}

process.exit(result.status ?? 1);
