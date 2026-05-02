/**
 * Storybook stories for the post-payment status views rendered by
 * EmbeddedCheckout. Each view is a small presentational component, so we
 * story them directly without driving the Stripe state machine.
 */
import {
  LoadingView,
  SuccessView,
  PendingView,
  ErrorView,
  HasSubscriptionView
} from './StatusViews';

export default {
  title: 'Shared/EmbeddedCheckout/StatusViews',
  parameters: {
    layout: 'centered',
    backgrounds: { default: 'dark' }
  },
  decorators: [
    (Story) => (
      <div
        style={{
          width: '480px',
          background: '#1a1a1a',
          borderRadius: '16px',
          color: '#fff'
        }}
      >
        <Story />
      </div>
    )
  ],
  tags: ['autodocs']
};

export const Loading = {
  render: () => <LoadingView />
};

export const Success = {
  render: () => (
    <SuccessView
      title="Welcome to Pro!"
      message="Pro features are unlocked on your account."
      ctaLabel="Continue"
      onCta={() => {}}
    />
  )
};

// Polling timed out — webhook is delayed but payment did succeed.
// Avoids the "premature success → refund request" path.
export const Pending = {
  render: () => <PendingView onClose={() => {}} />
};

export const Error_ = {
  name: 'Error',
  render: () => (
    <ErrorView
      message="Your card was declined. Please try a different payment method."
      onClose={() => {}}
    />
  )
};

export const ErrorGeneric = {
  name: 'Error (no message)',
  render: () => <ErrorView onClose={() => {}} />
};

export const HasSubscription = {
  render: () => <HasSubscriptionView onManage={() => {}} onClose={() => {}} />
};
