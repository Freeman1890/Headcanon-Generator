import fs from 'node:fs';
import path from 'node:path';
import { syncBuiltinESMExports } from 'node:module';
import { fileURLToPath } from 'node:url';

// Vercel aliases function directories with symlinks. Junctions preserve those
// directory aliases on Windows without enabling system-wide developer mode.
const original = fs.promises.symlink.bind(fs.promises);
const callbackOriginal = fs.symlink.bind(fs);
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../.vercel/output/functions') + path.sep;
function directoryAlias(target, destination) {
  const absolute = path.resolve(path.dirname(destination), target);
  return process.platform === 'win32' && path.resolve(destination).startsWith(root)
    && fs.statSync(absolute, { throwIfNoEntry: false })?.isDirectory() ? absolute : null;
}
fs.promises.symlink = async (target, destination, type) => {
  const absolute = directoryAlias(target, destination);
  if (absolute) return original(absolute, destination, 'junction');
  return original(target, destination, type);
};
fs.symlink = (target, destination, type, callback) => {
  if (typeof type === 'function') { callback = type; type = undefined; }
  const absolute = directoryAlias(target, destination);
  return callbackOriginal(absolute || target, destination, absolute ? 'junction' : type, callback);
};
syncBuiltinESMExports();
