#!/usr/bin/env node
// Turns Trivy JSON reports into the compact build summary the catalog site reads.
// Usage: summarize-scan.mjs --name keycloak --version 26.0.0 --image ref --digest sha256:..
//        --ours ours.json [--upstream upstream.json --upstream-image ref] --out summary.json
import { readFileSync, writeFileSync, existsSync } from 'node:fs';

const args = {};
for (let i = 2; i < process.argv.length; i += 2) args[process.argv[i].replace(/^--/, '')] = process.argv[i + 1];

const SEVERITIES = ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW', 'UNKNOWN'];

function load(path) {
  if (!path || !existsSync(path)) return null;
  try {
    return JSON.parse(readFileSync(path, 'utf8'));
  } catch {
    return null;
  }
}

function summarize(report) {
  if (!report) return null;
  const seen = new Map();
  for (const result of report.Results ?? []) {
    for (const v of result.Vulnerabilities ?? []) {
      const key = `${v.VulnerabilityID}|${v.PkgName}`;
      if (!seen.has(key)) seen.set(key, v);
    }
  }
  const counts = Object.fromEntries(SEVERITIES.map((s) => [s.toLowerCase(), 0]));
  for (const v of seen.values()) counts[(v.Severity ?? 'UNKNOWN').toLowerCase()] = (counts[(v.Severity ?? 'UNKNOWN').toLowerCase()] ?? 0) + 1;
  counts.total = seen.size;
  const top = [...seen.values()]
    .sort((a, b) => SEVERITIES.indexOf(a.Severity) - SEVERITIES.indexOf(b.Severity))
    .slice(0, 50)
    .map((v) => ({
      id: v.VulnerabilityID,
      pkg: v.PkgName,
      installed: v.InstalledVersion,
      fixed: v.FixedVersion ?? null,
      severity: v.Severity,
      title: v.Title ?? null,
    }));
  const packages = new Set();
  for (const result of report.Results ?? []) for (const p of result.Packages ?? []) packages.add(`${p.Name}@${p.Version}`);
  return { counts, top, packageCount: packages.size || null };
}

const ours = summarize(load(args.ours));
if (!ours) throw new Error(`could not read Trivy report ${args.ours}`);
const upstream = summarize(load(args.upstream));

const summary = {
  name: args.name,
  version: args.version,
  image: args.image,
  digest: args.digest,
  builtAt: new Date().toISOString(),
  runUrl: process.env.GITHUB_SERVER_URL
    ? `${process.env.GITHUB_SERVER_URL}/${process.env.GITHUB_REPOSITORY}/actions/runs/${process.env.GITHUB_RUN_ID}`
    : null,
  vulns: ours.counts,
  topVulns: ours.top,
  packageCount: ours.packageCount,
  upstream: upstream ? { image: args['upstream-image'], vulns: upstream.counts } : null,
};
writeFileSync(args.out, JSON.stringify(summary, null, 2));
console.log(`${args.name} ${args.version}: ${ours.counts.total} vulns (upstream: ${upstream?.counts.total ?? 'n/a'})`);
