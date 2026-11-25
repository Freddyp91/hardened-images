# Hardened Images

Minimal, signed, continuously rebuilt container images built from upstream releases on a [Wolfi](https://github.com/wolfi-dev) base.

| Image | Pull |
|---|---|
| Keycloak | `docker pull ghcr.io/freddyp91/hardened-images/keycloak:latest` |

## How it works

1. **Package.** `images/<name>/melange.yaml` packages the official upstream release (version and sha256 pinned).
2. **Assemble.** `images/<name>/apko.yaml` builds a distroless-style image on Wolfi: no package manager, non-root user, x86_64 and aarch64.
3. **Sign and attest.** Every image is signed keyless with cosign, gets an SPDX SBOM attestation, and GitHub build provenance.
4. **Scan.** Trivy scans our image and the upstream image for the same version. Results are committed to `data/images/<name>.json`.
5. **Publish.** The Next.js catalog in `site/` is rebuilt from that data and deployed to GitHub Pages.

## Workflows

| Workflow | When | What |
|---|---|---|
| `Watch upstream` | hourly | Checks upstream GitHub releases, pins the new version + sha256, triggers a build |
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

Every image must have tests, and the build refuses images without them:

- a `test:` section in `melange.yaml`, run with `melange test` against the built package
- an executable `smoke-test.sh` that runs the real image and checks that it works (Keycloak: boots, reports healthy, serves OIDC, accepts admin login, runs as non-root)

Images are only published after both pass.

## One-time setup

- **Settings → Pages → Source: GitHub Actions** so the catalog can deploy.
- **Settings → Actions → General → Workflow permissions: Read and write** so the workflows can commit results.
- After the first build, open each package under your profile's **Packages** tab and set visibility to **Public** so anyone can pull.

Images are built from upstream open source releases and Wolfi packages. They are not derived from Chainguard Images.
