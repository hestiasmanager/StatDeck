const fs = require('fs');

const origSymlink = fs.symlink;
const origSymlinkSync = fs.symlinkSync;
const origPromisesSymlink = fs.promises.symlink;

function copyFallback(target, path) {
  try {
    const stat = fs.statSync(target);
    if (stat.isDirectory()) {
      fs.cpSync(target, path, { recursive: true });
    } else {
      fs.copyFileSync(target, path);
    }
  } catch (err) {
    // ignore
  }
}

fs.symlink = function (target, path, type, callback) {
  const cb = typeof type === 'function' ? type : callback;
  const actualType = typeof type === 'string' ? type : undefined;
  origSymlink.call(fs, target, path, actualType, (err) => {
    if (err && err.code === 'EPERM') {
      try {
        copyFallback(target, path);
        if (cb) cb(null);
      } catch (copyErr) {
        if (cb) cb(copyErr);
      }
    } else {
      if (cb) cb(err);
    }
  });
};

fs.symlinkSync = function (target, path, type) {
  try {
    return origSymlinkSync.call(fs, target, path, type);
  } catch (err) {
    if (err.code === 'EPERM') {
      return copyFallback(target, path);
    }
    throw err;
  }
};

fs.promises.symlink = async function (target, path, type) {
  try {
    return await origPromisesSymlink.call(fs.promises, target, path, type);
  } catch (err) {
    if (err.code === 'EPERM') {
      return copyFallback(target, path);
    }
    throw err;
  }
};

console.log('[Shim] fs.symlink -> copyFallback installed.');
