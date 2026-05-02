/**
 * Paywall surface registry — surface-specific copy for the shared UpgradeModal.
 * Keyed by the `postCheckout` value passed to startCheckout(). When a key
 * matches, the modal renders a surface card header + custom headline /
 * description in place of the generic "Upgrade to Pro" treatment.
 *
 * Adding a new surface: add an entry whose key matches the postCheckout
 * string used at the trigger site (see startCheckout calls in editor).
 * Omit entries to keep generic copy.
 */

const CubeIcon = () => (
  <svg
    width="22"
    height="22"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
    <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
    <line x1="12" y1="22.08" x2="12" y2="12" />
  </svg>
);

const ImageIcon = () => (
  <svg
    width="22"
    height="22"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
    <circle cx="8.5" cy="8.5" r="1.5" />
    <polyline points="21 15 16 10 5 21" />
  </svg>
);

export const PAYWALL_SURFACES = {
  // GLB + AR-Ready GLB both flow through postCheckout='export'.
  // AR-Ready is on a deprecation path, so a single shared surface is fine.
  export: {
    icon: <CubeIcon />,
    title: 'GLB glTF',
    subtitle: '.glb · 3D model export',
    headline: 'Export requires Pro',
    description:
      'GLB glTF export lets you use your 3D scene in any compatible tool, game engine, or AR platform.',
    features: [
      'GLB glTF & AR Ready GLB export',
      'Download JPEG snapshots without watermark',
      'Unlimited geospatial maps & location changes',
      'Import custom 3D models & SVG / glTF files',
      '100 AI generation tokens / month'
    ]
  },

  // Watermark removal — fired by the inline upsell button and by the
  // first-of-session download interceptor in ScreenshotModal. AI-render
  // token gates use postCheckout='image' and stay on the generic header.
  watermark: {
    icon: <ImageIcon />,
    title: 'Snapshot',
    subtitle: '.jpg / .png · 2D image export',
    headline: 'Remove the watermark',
    description:
      'Share polished snapshots in client presentations, planning reports, and social posts.',
    features: [
      'Download JPEG snapshots without watermark',
      'GLB glTF & AR Ready GLB export',
      'Unlimited geospatial maps & location changes',
      'Import custom 3D models & SVG / glTF files',
      '100 AI generation tokens / month'
    ],
    // Soft-decline path. Picking this dismisses the paywall and runs the
    // pending action (the watermarked download) without leaving Pro friction.
    secondaryCtaLabel: 'Continue free with watermark'
  }
};

export const getPaywallSurface = (key) =>
  (key && PAYWALL_SURFACES[key]) || null;
