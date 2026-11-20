const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const rootDir = path.resolve(__dirname, '..');
const shimPath = path.join(rootDir, 'shim-symlink.cjs');

console.log('[Cloudflare Build] Starting OpenNext Cloudflare Worker build...');

// 1. Run OpenNext build with symlink and copyfile shims
const env = {
  ...process.env,
  NODE_OPTIONS: `--require "${shimPath.replace(/\\/g, '/')}" ${process.env.NODE_OPTIONS || ''}`.trim(),
};

try {
  execSync('pnpm exec opennextjs-cloudflare build', {
    cwd: rootDir,
    env,
    stdio: 'inherit',
  });
} catch (err) {
  console.error('[Cloudflare Build] OpenNext build failed.');
  process.exit(1);
}

// 2. Post-build patch for Windows dynamic require of middleware-manifest.json
const handlerPath = path.join(rootDir, '.open-next/server-functions/default/handler.mjs');
if (fs.existsSync(handlerPath)) {
  let code = fs.readFileSync(handlerPath, 'utf8');
  const target = 'getMiddlewareManifest(){return this.minimalMode?null:require(this.middlewareManifestPath)}';
  const replacement = 'getMiddlewareManifest(){try{return require(this.middlewareManifestPath)}catch(e){return {version:3,middleware:{},functions:{},sortedMiddleware:[]}}}';
  if (code.includes(target)) {
    code = code.replace(target, replacement);
    fs.writeFileSync(handlerPath, code);
    console.log('[Cloudflare Build] Patched getMiddlewareManifest in handler.mjs successfully.');
  } else {
    console.log('[Cloudflare Build] getMiddlewareManifest already patched or not present.');
  }
}

// 3. Size report
const workerPath = path.join(rootDir, '.open-next/worker.js');
if (fs.existsSync(workerPath)) {
  const stat = fs.statSync(workerPath);
  console.log(`[Cloudflare Build] Worker bundle generated at: .open-next/worker.js`);
  console.log(`[Cloudflare Build] Worker entrypoint size: ${(stat.size / 1024).toFixed(2)} KB`);
}

function getDirSize(dir) {
  let size = 0;
  if (!fs.existsSync(dir)) return 0;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) size += getDirSize(full);
    else if (entry.isFile()) size += fs.statSync(full).size;
  }
  return size;
}

const openNextDir = path.join(rootDir, '.open-next');
const totalMB = (getDirSize(openNextDir) / (1024 * 1024)).toFixed(2);
console.log(`[Cloudflare Build] Total .open-next package size: ${totalMB} MB (Cloudflare limit: 64 MB)`);
console.log('[Cloudflare Build] ✅ Ready for Cloudflare Workers deployment (`pnpm worker:dev` or `wrangler deploy`).');
