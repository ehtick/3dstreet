/**
 * Storybook stories for UpgradeModal.
 *
 * The pricing view renders fully — Storybook doesn't have real Firebase, so
 * the checkActiveSubscriptions pre-flight rejects and UpgradeModal falls
 * through to showing pricing (its expected fallback behavior).
 *
 * Stripe's EmbeddedCheckout iframe won't load with the mock publishable key,
 * so the checkout state isn't useful here. The post-payment state views
 * (loading / success / pending / error / has-subscription) live in
 * StatusViews.stories.jsx and are storied independently.
 */
import UpgradeModal from './UpgradeModal';
import { AuthContext } from '@shared/contexts';

const mockUser = {
  uid: 'storybook-user',
  email: 'demo@example.com',
  isPro: false,
  getIdToken: () => Promise.resolve('mock-token')
};

const MockAuthProvider = ({ children, user = mockUser }) => (
  <AuthContext.Provider
    value={{
      currentUser: user,
      setCurrentUser: () => {},
      tokenProfile: { genToken: 0, credToken: 0 },
      refreshTokenProfile: () => Promise.resolve(),
      isLoading: false
    }}
  >
    {children}
  </AuthContext.Provider>
);

export default {
  title: 'Shared/UpgradeModal',
  component: UpgradeModal,
  parameters: {
    layout: 'fullscreen',
    backgrounds: { default: 'dark' }
  },
  decorators: [
    (Story, context) => (
      <MockAuthProvider user={context.args.user ?? mockUser}>
        <Story />
      </MockAuthProvider>
    )
  ],
  argTypes: {
    isOpen: {
      description: 'Whether the modal is shown',
      control: 'boolean'
    },
    source: {
      description: 'PostHog source attribution',
      control: 'text'
    },
    trigger: {
      description: 'PostHog trigger context (e.g. gen_token_limit)',
      control: 'text'
    },
    onClose: { action: 'close' },
    onCheckoutStart: { action: 'checkoutStart' },
    onSuccess: { action: 'success' }
  },
  tags: ['autodocs']
};

// Default — pricing view, Yearly billing selected (best value).
// Click the Monthly toggle to see the $10/month variant.
export const Pricing = {
  args: {
    isOpen: true,
    source: 'storybook',
    trigger: 'demo'
  }
};

// Logged-out state. Without a currentUser the subscription pre-check is
// skipped entirely; pricing renders immediately.
export const LoggedOut = {
  args: {
    isOpen: true,
    source: 'storybook',
    trigger: 'demo',
    user: null
  }
};

export const Closed = {
  args: {
    isOpen: false
  }
};

// Surface variant — mimics the GLB export paywall: surface card header,
// "Export requires Pro" headline, and surface-specific feature list.
export const ExportSurface = {
  args: {
    isOpen: true,
    source: 'export',
    trigger: 'export_paywall',
    surface: 'export'
  }
};

// Surface variant — watermark removal flow from the screenshot modal.
export const WatermarkSurface = {
  args: {
    isOpen: true,
    source: 'watermark',
    trigger: 'watermark_paywall',
    surface: 'watermark'
  }
};
