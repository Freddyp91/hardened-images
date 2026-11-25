import { readdirSync, readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';

const dataDir = join(process.cwd(), '..', 'data', 'images');

export function getImages() {
  if (!existsSync(dataDir)) return [];
  return readdirSync(dataDir)
    .filter((f) => f.endsWith('.json'))
    .map((f) => JSON.parse(readFileSync(join(dataDir, f), 'utf8')))
    .sort((a, b) => a.name.localeCompare(b.name));
}

export function getImage(name) {
  return getImages().find((i) => i.name === name) ?? null;
}

export const repoUrl = process.env.NEXT_PUBLIC_REPO_URL || '';

export function timeAgo(iso) {
  const mins = Math.round((Date.now() - new Date(iso).getTime()) / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.round(mins / 60);
  if (hours < 48) return `${hours}h ago`;
  return `${Math.round(hours / 24)}d ago`;
}
