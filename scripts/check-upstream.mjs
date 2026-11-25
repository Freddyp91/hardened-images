#!/usr/bin/env node
// Checks each image's upstream GitHub project for a newer release and, when one
// exists, pins the new version and the release tag's commit in images/<name>/melange.yaml
// (packages are built from source with melange's git-checkout).
// Prints the names of updated images (space separated) and writes them to
// $GITHUB_OUTPUT as `updated=...` when running in Actions.
import { appendFileSync, readdirSync, readFileSync, writeFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';

const root = new URL('..', import.meta.url).pathname;
const imagesDir = join(root, 'images');
const only = process.argv.slice(2);

const ghHeaders = { 'User-Agent': 'hardened-images-watcher', Accept: 'application/vnd.github+json' };
if (process.env.GITHUB_TOKEN) ghHeaders.Authorization = `Bearer ${process.env.GITHUB_TOKEN}`;

function cmpVersion(a, b) {
  const pa = a.split(/[.-]/).map((x) => parseInt(x, 10) || 0);
  const pb = b.split(/[.-]/).map((x) => parseInt(x, 10) || 0);
  for (let i = 0; i < Math.max(pa.length, pb.length); i++) {
    const d = (pa[i] ?? 0) - (pb[i] ?? 0);
    if (d) return d;
  }
  return 0;
}

async function latestRelease(repo) {
  const body = await gh(`/repos/${repo}/releases/latest`);
  return { tag: body.tag_name, version: body.tag_name.replace(/^v/, '') };
}

async function gh(path) {
  const res = await fetch(`https://api.github.com${path}`, { headers: ghHeaders });
  if (!res.ok) throw new Error(`GitHub API ${res.status} for ${path}`);
  return res.json();
}

// Resolves a tag (lightweight or annotated) to the commit it points at.
async function tagCommit(repo, tag) {
  let obj = (await gh(`/repos/${repo}/git/ref/tags/${encodeURIComponent(tag)}`)).object;
  while (obj.type === 'tag') obj = (await gh(`/repos/${repo}/git/tags/${obj.sha}`)).object;
  if (obj.type !== 'commit') throw new Error(`${repo}@${tag} does not point at a commit`);
  return obj.sha;
}

const updated = [];
for (const name of readdirSync(imagesDir)) {
  if (only.length && !only.includes(name)) continue;
  const metaPath = join(imagesDir, name, 'image.json');
  const melangePath = join(imagesDir, name, 'melange.yaml');
  if (!existsSync(metaPath) || !existsSync(melangePath)) continue;

  const meta = JSON.parse(readFileSync(metaPath, 'utf8'));
  let melange = readFileSync(melangePath, 'utf8');
  const current = melange.match(/^  version: (\S+)$/m)?.[1];
  if (!current) throw new Error(`${name}: could not find package.version in melange.yaml`);

  const { tag, version: latest } = await latestRelease(meta.upstream.github);
  if (cmpVersion(latest, current) <= 0) {
    console.error(`${name}: up to date at ${current}`);
    continue;
  }

  const commit = await tagCommit(meta.upstream.github, tag);
  console.error(`${name}: ${current} -> ${latest} (tag ${tag}, commit ${commit})`);

  melange = melange
    .replace(/^  version: \S+$/m, `  version: ${latest}`)
    .replace(/^  epoch: \d+$/m, '  epoch: 0')
    .replace(/expected-commit: [0-9a-f]{40}/, `expected-commit: ${commit}`);
  writeFileSync(melangePath, melange);
  updated.push(name);
}

console.log(updated.join(' '));
if (process.env.GITHUB_OUTPUT) appendFileSync(process.env.GITHUB_OUTPUT, `updated=${updated.join(' ')}\n`);
