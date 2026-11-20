const fs = require('fs');
const path = require('path');

// Ensure electron is deleted if present so wrangler and CLI don't misbehave
if (process.versions && process.versions.electron) {
  delete process.versions.electron;
}

const origSymlink = fs.symlink;
const origSymlinkSync = fs.symlinkSync;
const origPromisesSymlink = fs.promises.symlink;

function copyFallback(target, dest) {
  try {
    const stat = fs.statSync(target);
    if (stat.isDirectory()) {
      fs.cpSync(target, dest, { recursive: true });
    } else {
      fs.mkdirSync(path.dirname(dest), { recursive: true });
      fs.copyFileSync(target, dest);
    }
  } catch (err) {
    // ignore
  }
}

fs.symlink = function (target, dest, type, callback) {
  const cb = typeof type === 'function' ? type : callback;
  const actualType = typeof type === 'string' ? type : undefined;
  origSymlink.call(fs, target, dest, actualType, (err) => {
    if (err && (err.code === 'EPERM' || err.code === 'ENOENT')) {
      try {
        copyFallback(target, dest);
        if (cb) cb(null);
      } catch (copyErr) {
        if (cb) cb(copyErr);
      }
    } else {
      if (cb) cb(err);
    }
  });
};

fs.symlinkSync = function (target, dest, type) {
  try {
    return origSymlinkSync.call(fs, target, dest, type);
  } catch (err) {
    if (err.code === 'EPERM' || err.code === 'ENOENT') {
      return copyFallback(target, dest);
    }
    throw err;
  }
};

fs.promises.symlink = async function (target, dest, type) {
  try {
    return await origPromisesSymlink.call(fs.promises, target, dest, type);
  } catch (err) {
    if (err.code === 'EPERM' || err.code === 'ENOENT') {
      return copyFallback(target, dest);
    }
    throw err;
  }
};

// Wrap copyFileSync to auto-create parent directories on ENOENT
// and if copying @vercel/og files, also copy the font and wasm assets
const origCopyFileSync = fs.copyFileSync;
fs.copyFileSync = function (src, dest, mode) {
  try {
    const res = origCopyFileSync.call(fs, src, dest, mode);
    if (typeof dest === 'string' && dest.includes('@vercel') && dest.includes('og') && dest.endsWith('index.edge.js')) {
      const srcDir = path.dirname(src);
      const destDir = path.dirname(dest);
      for (const item of ['noto-sans-v27-latin-regular.ttf', 'resvg.wasm', 'yoga.wasm']) {
        const itemSrc = path.join(srcDir, item);
        const itemDest = path.join(destDir, item);
        if (fs.existsSync(itemSrc) && !fs.existsSync(itemDest)) {
          origCopyFileSync.call(fs, itemSrc, itemDest);
        }
      }
    }
    return res;
  } catch (err) {
    if (err.code === 'ENOENT') {
      try {
        fs.mkdirSync(path.dirname(dest), { recursive: true });
        const res = origCopyFileSync.call(fs, src, dest, mode);
        if (typeof dest === 'string' && dest.includes('@vercel') && dest.includes('og') && dest.endsWith('index.edge.js')) {
          const srcDir = path.dirname(src);
          const destDir = path.dirname(dest);
          for (const item of ['noto-sans-v27-latin-regular.ttf', 'resvg.wasm', 'yoga.wasm']) {
            const itemSrc = path.join(srcDir, item);
            const itemDest = path.join(destDir, item);
            if (fs.existsSync(itemSrc) && !fs.existsSync(itemDest)) {
              origCopyFileSync.call(fs, itemSrc, itemDest);
            }
          }
        }
        return res;
      } catch (innerErr) {
        throw err;
      }
    }
    throw err;
  }
};

const origCopyFile = fs.copyFile;
fs.copyFile = function (src, dest, mode, callback) {
  const cb = typeof mode === 'function' ? mode : callback;
  const actualMode = typeof mode === 'number' ? mode : 0;
  origCopyFile.call(fs, src, dest, actualMode, (err) => {
    if (err && err.code === 'ENOENT') {
      try {
        fs.mkdirSync(path.dirname(dest), { recursive: true });
        origCopyFile.call(fs, src, dest, actualMode, cb);
      } catch (innerErr) {
        if (cb) cb(err);
      }
    } else {
      if (cb) cb(err);
    }
  });
};

const origPromisesCopyFile = fs.promises.copyFile;
fs.promises.copyFile = async function (src, dest, mode) {
  try {
    return await origPromisesCopyFile.call(fs.promises, src, dest, mode);
  } catch (err) {
    if (err.code === 'ENOENT') {
      try {
        fs.mkdirSync(path.dirname(dest), { recursive: true });
        return await origPromisesCopyFile.call(fs.promises, src, dest, mode);
      } catch (innerErr) {
        throw err;
      }
    }
    throw err;
  }
};

// Wrap renameSync and rename to fallback if oldPath is missing (e.g. @vercel/og font)
const origRenameSync = fs.renameSync;
fs.renameSync = function (oldPath, newPath) {
  try {
    return origRenameSync.call(fs, oldPath, newPath);
  } catch (err) {
    if (err.code === 'ENOENT') {
      const basename = path.basename(oldPath);
      const candidates = [
        path.join(process.cwd(), '.next/standalone/node_modules/next/dist/compiled/@vercel/og', basename),
        path.join(process.cwd(), 'node_modules/next/dist/compiled/@vercel/og', basename),
      ];
      for (const cand of candidates) {
        if (fs.existsSync(cand)) {
          fs.mkdirSync(path.dirname(newPath), { recursive: true });
          fs.copyFileSync(cand, newPath);
          return;
        }
      }
    }
    throw err;
  }
};

const origRename = fs.rename;
fs.rename = function (oldPath, newPath, callback) {
  origRename.call(fs, oldPath, newPath, (err) => {
    if (err && err.code === 'ENOENT') {
      const basename = path.basename(oldPath);
      const candidates = [
        path.join(process.cwd(), '.next/standalone/node_modules/next/dist/compiled/@vercel/og', basename),
        path.join(process.cwd(), 'node_modules/next/dist/compiled/@vercel/og', basename),
      ];
      for (const cand of candidates) {
        if (fs.existsSync(cand)) {
          try {
            fs.mkdirSync(path.dirname(newPath), { recursive: true });
            fs.copyFileSync(cand, newPath);
            return callback(null);
          } catch (inner) {
            return callback(err);
          }
        }
      }
      return callback(err);
    }
    callback(err);
  });
};

// Wrap rmSync to handle Windows ENOTEMPTY/EBUSY with retries
const origRmSync = fs.rmSync;
fs.rmSync = function (targetPath, options) {
  try {
    return origRmSync.call(fs, targetPath, options);
  } catch (err) {
    if (err.code === 'ENOTEMPTY' || err.code === 'EBUSY') {
      try {
        const { execSync } = require('child_process');
        execSync(`rmdir /s /q "${targetPath}"`, { stdio: 'ignore' });
        return;
      } catch (inner) {}
    }
    throw err;
  }
};

console.log('[Shim] fs.symlink, fs.copyFile, fs.rename & fs.rmSync shims installed.');
