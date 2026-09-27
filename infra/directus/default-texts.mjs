// Memuat semua teks bawaan website (kunci → {id, en}) langsung dari
// src/content/site.ts, tanpa build: file ditranspilasi di memori lalu
// `defaultTexts()` dipanggil. overrides.json sengaja dikosongkan supaya yang
// terbaca benar-benar nilai bawaan, bukan nilai yang sudah ditimpa CMS.
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { join } from 'node:path';

export function loadDefaultTexts(root) {
  const require = createRequire(join(root, 'package.json'));
  const ts = require('typescript');
  const src = readFileSync(join(root, 'src/content/site.ts'), 'utf8');
  const js = ts.transpileModule(src, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, esModuleInterop: true },
  }).outputText;

  const json = (name) => JSON.parse(readFileSync(join(root, 'src/content', name), 'utf8'));
  const stub = (id) => {
    if (id.endsWith('projects.json')) return json('projects.json');
    if (id.endsWith('team.json')) return json('team.json');
    return {}; // overrides.json & lainnya
  };
  const mod = { exports: {} };
  new Function('require', 'module', 'exports', js)(stub, mod, mod.exports);
  return mod.exports.defaultTexts();
}
