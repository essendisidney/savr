/** Preload: resolve @supabase/supabase-js from apps/web/node_modules. */
const Module = require("module");
const path = require("path");
const webModules = path.join(__dirname, "../../apps/web/node_modules");
const orig = Module._nodeModulePaths;
Module._nodeModulePaths = function (from) {
  const paths = orig.call(this, from);
  if (!paths.includes(webModules)) paths.unshift(webModules);
  return paths;
};
