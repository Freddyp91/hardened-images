// Site-wide facts and copy that are not per-image build data.
export const site = {
  name: 'Hardened Images',
  tagline: 'The images you already run, minus the CVEs.',
  rebuildCadence: 'every 6 hours',
  platforms: 'amd64, arm64',
  base: 'Wolfi',
};

// Images being worked on. Entries disappear automatically once their scan data exists.
export const roadmap = [
  { name: 'argocd', title: 'Argo CD', description: 'GitOps continuous delivery for Kubernetes', status: 'In progress' },
];
