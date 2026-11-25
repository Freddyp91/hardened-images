#!/usr/bin/env node
// Merges build summaries (from summarize-scan.mjs) into data/images/<name>.json,
// keeping the latest build plus a bounded rebuild history.
// Usage: merge-results.mjs summary1.json [summary2.json ...]
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';

const root = new URL('..', import.meta.url).pathname;
const dataDir = join(root, 'data', 'images');
mkdirSync(dataDir, { recursive: true });
const HISTORY_LIMIT = 120;

for (const file of process.argv.slice(2)) {
  const s = JSON.parse(readFileSync(file, 'utf8'));
  const meta = JSON.parse(readFileSync(join(root, 'images', s.name, 'image.json'), 'utf8'));
  const outPath = join(dataDir, `${s.name}.json`);
  const existing = existsSync(outPath) ? JSON.parse(readFileSync(outPath, 'utf8')) : { history: [] };

  const entry = {
    builtAt: s.builtAt,
    version: s.version,
    digest: s.digest,
    vulns: s.vulns,
    upstreamVulns: s.upstream?.vulns ?? null,
    runUrl: s.runUrl,
  };
  const history = [entry, ...(existing.history ?? [])].slice(0, HISTORY_LIMIT);

  const record = {
    name: s.name,
    title: meta.title,
    description: meta.description,
    image: s.image,
    usage: meta.usage,
    upstream: { github: meta.upstream.github, image: s.upstream?.image ?? meta.upstream.image },
    latest: { ...entry, topVulns: s.topVulns, packageCount: s.packageCount },
    history,
  };
  writeFileSync(outPath, JSON.stringify(record, null, 2) + '\n');
  console.log(`updated ${outPath}`);
}
