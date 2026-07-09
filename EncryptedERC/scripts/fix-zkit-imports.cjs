// @solarity/zktype emits relative import paths with OS-native separators.
// On Windows, generated-types use backslashes in `from "..\\helpers"` imports.
// Node cannot resolve those; normalize to forward slashes (valid on Windows too).
const fs = require("fs");
const path = require("path");

const root = path.join(__dirname, "..", "generated-types", "zkit");

function walk(dir) {
  if (!fs.existsSync(dir)) {
    return [];
  }

  return fs.readdirSync(dir, {withFileTypes: true}).flatMap((entry) => {
    const fullPath = path.join(dir, entry.name);
    return entry.isDirectory() ? walk(fullPath) : [fullPath];
  });
}

for (const file of walk(root)) {
  if (!file.endsWith(".ts")) {
    continue;
  }

  const source = fs.readFileSync(file, "utf8");
  const fixed = source.replace(
    /(from\s+["'][^"']*)\\([^"']*["'])/g,
    (_match, prefix, suffix) => `${prefix}/${suffix}`,
  );

  if (fixed !== source) {
    fs.writeFileSync(file, fixed);
  }
}
