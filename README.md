# Hardened Images

Minimal, signed, continuously rebuilt container images compiled from upstream source on a [Wolfi](https://github.com/wolfi-dev) base.

| Image | Pull |
|---|---|
| Keycloak | `docker pull ghcr.io/freddyp91/hardened-images/keycloak:latest` |

## How it works

1. **Build from source.** `images/<name>/melange.yaml` checks out the upstream release tag (commit pinned) and compiles it (Keycloak: Maven). No upstream binaries are used. Dependency versions can be overridden with patched releases via `vars.maven-overrides`.
   Packages build natively on x86_64 and arm64 runners and are cached until `melange.yaml` changes.
2. **Assemble.** `images/<name>/apko.yaml` builds a distroless-style image on Wolfi: no package manager, non-root user, x86_64 and aarch64.
3. **Sign and attest.** Every image is signed keyless with cosign and gets two SBOM attestations (SPDX for OS packages, CycloneDX for bundled libraries) plus GitHub build provenance.
4. **Scan.** Trivy scans OS packages *and* every bundled library (JARs etc.). Trivy normally skips files owned by an OS package, so we also scan the image filesystem with the apk database removed. The upstream image for the same version is scanned for comparison. Results are committed to `data/images/<name>.json`.
5. **Publish.** The Next.js catalog in `site/` is rebuilt from that data and deployed to GitHub Pages.

## Workflows

| Workflow | When | What |
|---|---|---|
| `Watch upstream` | hourly | Checks upstream GitHub releases, pins the new version + tag commit, triggers a build |
| `Build images` | every 6 hours, on push to `images/`, manual | melange, apko publish to GHCR, cosign, provenance, Trivy, record results |
| `Deploy catalog site` | after every build, on push to `site/` | Builds the static catalog and deploys to Pages |

## Verify an image

```sh
cosign verify ghcr.io/freddyp91/hardened-images/keycloak:latest \
  --certificate-identity https://github.com/Freddyp91/hardened-images/.github/workflows/build.yml@refs/heads/main \
  --certificate-oidc-issuer https://token.actions.githubusercontent.com
```

## Adding an image

Create `images/<name>/` with `image.json` (upstream metadata), `melange.yaml` (version `0.0.0`, zero sha), `apko.yaml`, and `smoke-test.sh`, then run **Watch upstream** to pin the first version.

Every image must follow these rules, enforced by `scripts/check-image-policy.sh`:

- built from source with melange `git-checkout` at a pinned `expected-commit` (no `fetch` of release binaries)

- a `test:` section in `melange.yaml`, run with `melange test` against the built package
- an executable `smoke-test.sh` that runs the real image and checks that it works (Keycloak: boots, reports healthy, serves OIDC, accepts admin login, runs as non-root)

Images are only published after both pass.

## One-time setup

- **Settings → Pages → Source: GitHub Actions** so the catalog can deploy.
- **Settings → Actions → General → Workflow permissions: Read and write** so the workflows can commit results.
- After the first build, open each package under your profile's **Packages** tab and set visibility to **Public** so anyone can pull.

Images are built from upstream open source releases and Wolfi packages. They are not derived from Chainguard Images.
