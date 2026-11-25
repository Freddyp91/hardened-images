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

export const repoUrl = process.env.NEXT_PUBLIC_REPO_URL || 'https://github.com/Freddyp91/hardened-images';
export const basePath = process.env.NEXT_PUBLIC_BASE_PATH || '';

// The scan data stores the upstream image with its tag already applied
// (e.g. quay.io/keycloak/keycloak:26.8.2). Only append the version when it is missing.
export function upstreamRef(img) {
  const ref = img.upstream?.image;
  if (!ref) return null;
  const lastSegment = ref.split('/').pop();
  return lastSegment.includes(':') || ref.includes('@') ? ref : `${ref}:${img.latest.version}`;
}

export function reduction(img) {
  const ours = img.latest.vulns?.total;
  const theirs = img.latest.upstreamVulns?.total;
  if (ours == null || !theirs) return null;
  return Math.round(((theirs - ours) / theirs) * 100);
}

export function shortDigest(d) {
  return d ? d.replace('sha256:', '').slice(0, 12) : '';
}

export function formatUtc(iso) {
  const d = new Date(iso);
  return d.toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit', hour12: false, timeZone: 'UTC' });
}

export const SEVERITIES = [
  ['critical', 'Critical'],
  ['high', 'High'],
  ['medium', 'Medium'],
  ['low', 'Low'],
];
