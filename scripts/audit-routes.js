const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const appRoot = path.join(root, 'app');
const routesSource = fs.readFileSync(path.join(root, 'constants/routes.ts'), 'utf8');
const routeEntries = [...routesSource.matchAll(/\b([A-Za-z]\w*):\s*['"]([^'"]+)['"]/g)];
const routes = new Map(routeEntries.map(([, key, value]) => [key, value]));

function filesUnder(directory) {
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap(entry => {
    if (entry.isDirectory() && ['node_modules', '.expo', 'dist', '.git'].includes(entry.name)) return [];
    const full = path.join(directory, entry.name);
    return entry.isDirectory() ? filesUnder(full) : [full];
  });
}

function routeExists(href) {
  const normalized = href.split(/[?#]/, 1)[0];
  const segments = normalized.split('/').filter(Boolean);
  const stem = path.join(appRoot, ...segments);
  return [stem + '.tsx', stem + '.ts', path.join(stem, 'index.tsx'), path.join(stem, 'index.ts')]
    .some(candidate => fs.existsSync(candidate));
}

const problems = [];
for (const [key, href] of routes) {
  if (!routeExists(href)) problems.push(`ROUTES.${key} -> ${href} (no matching app file)`);
}

const sourceFiles = filesUnder(root).filter(file =>
  /\.(tsx|ts|jsx|js)$/.test(file) && !file.includes(`${path.sep}node_modules${path.sep}`) &&
  !file.includes(`${path.sep}.expo${path.sep}`) && !file.includes(`${path.sep}dist${path.sep}`) &&
  file !== __filename
);
for (const file of sourceFiles) {
  const source = fs.readFileSync(file, 'utf8');
  const refs = [
    ...source.matchAll(/router\.(?:push|replace)\(\s*(ROUTES\.([A-Za-z]\w*)|['"]([^'"]+)['"])/g),
    ...source.matchAll(/<Link\b[^>]*\bhref=\{?\s*(ROUTES\.([A-Za-z]\w*)|['"]([^'"]+)['"])/g),
  ];
  for (const match of refs) {
    const key = match[2];
    const href = key ? routes.get(key) : match[3];
    if (!href) problems.push(`${path.relative(root, file)} uses unknown ${match[1]}`);
    else if (!routeExists(href)) problems.push(`${path.relative(root, file)} -> ${href} (no matching app file)`);
  }
}

if (problems.length) {
  console.error(`Route audit failed: ${problems.length} dead or unknown route(s)`);
  for (const problem of problems) console.error(`- ${problem}`);
  process.exitCode = 1;
} else {
  console.log(`Route audit passed: ${routes.size} routes resolve; navigation references have no dead links.`);
}
