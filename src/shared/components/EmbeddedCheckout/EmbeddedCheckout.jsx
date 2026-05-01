/**
 * EmbeddedCheckout - shared inline Stripe checkout for editor + generator.
 *
 * Encapsulates the Stripe EmbeddedCheckout provider, client-secret fetch,
 * onComplete polling, and the post-payment loading / success / pending /
 * error / has-subscription states. Caller handles plan selection UI and
 * mounts this component once a price has been chosen.
 *
 * IMPORTANT: callers must pass a stable `verifyPurchase` (use `useCallback`).
 * It feeds into the memoized `checkoutOptions` passed to Stripe's
 * `EmbeddedCheckoutProvider`. If the reference changes between renders the
 * provider tears down and re-creates the iframe, which mid-payment is bad.
 */
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import PropTypes from 'prop-types';
import { loadStripe } from '@stripe/stripe-js';
import {
  EmbeddedCheckoutProvider,
  EmbeddedCheckout as StripeEmbeddedCheckout
} from '@stripe/react-stripe-js';
import { httpsCallable } from 'firebase/functions';
import posthog from 'posthog-js';
import { functions } from '@shared/services/firebase';
import {
  LoadingView,
  SuccessView,
  PendingView,
  ErrorView,
  HasSubscriptionView
} from './StatusViews';
import styles from './EmbeddedCheckout.module.scss';

let stripePromise;
const getStripe = () => {
  if (!stripePromise) {
    stripePromise = loadStripe(process.env.STRIPE_PUBLISHABLE_KEY);
  }
  return stripePromise;
};

// Webhooks usually land in seconds, but we give them up to 30s before
// switching to the "still finalizing" state instead of claiming success.
const POLL_INTERVAL_MS = 2000;
const POLL_MAX_ATTEMPTS = 15;

const EmbeddedCheckout = ({
  priceId,
  mode = 'subscription',
  source,
  plan,
  metadata,
  verifyPurchase,
  onSuccess,
  onClose,
  successTitle = 'Payment Successful!',
  successMessage = 'Thanks for your purchase. Your account is ready to go.',
  successCta = 'Done'
}) => {
  const [state, setState] = useState('checkout');
  // 'checkout' | 'loading' | 'success' | 'pending' | 'error' | 'has-subscription'
  const [errorMessage, setErrorMessage] = useState(null);
  const formLoadedRef = useRef(false);
  const pollIntervalRef = useRef(null);

  const clearPolling = useCallback(() => {
    if (pollIntervalRef.current) {
      clearInterval(pollIntervalRef.current);
      pollIntervalRef.current = null;
    }
  }, []);

  useEffect(() => clearPolling, [clearPolling]);

  const startPolling = useCallback(() => {
    if (typeof verifyPurchase !== 'function') {
      // No verification predicate — assume webhook will catch up.
      setState('success');
      posthog.capture('payment_completed', { plan, source });
      return;
    }

    let attempts = 0;
    pollIntervalRef.current = setInterval(async () => {
      attempts++;
      try {
        const ok = await verifyPurchase();
        if (ok) {
          clearPolling();
          setState('success');
          posthog.capture('payment_completed', { plan, source });
        } else if (attempts >= POLL_MAX_ATTEMPTS) {
          clearPolling();
          // Webhook still pending — be honest about it instead of
          // showing premature success (which leads to refund requests).
          setState('pending');
          posthog.capture('payment_completed', {
            plan,
            source,
            finalizing: true
          });
        }
      } catch (err) {
        console.error('Error verifying purchase:', err);
        if (attempts >= POLL_MAX_ATTEMPTS) {
          clearPolling();
          setState('pending');
        }
      }
    }, POLL_INTERVAL_MS);
  }, [verifyPurchase, plan, source, clearPolling]);

  const checkoutOptions = useMemo(
    () => ({
      fetchClientSecret: async () => {
        try {
          const createStripeSession = httpsCallable(
            functions,
            'createStripeSession'
          );
          const { data } = await createStripeSession({
            ui_mode: 'embedded',
            redirect_on_completion: 'never',
            line_items: [{ price: priceId, quantity: 1 }],
            mode,
            ...(metadata ? { metadata } : {})
          });

          if (!formLoadedRef.current) {
            formLoadedRef.current = true;
            // Inline-load timing event — measures time from mount to form ready.
            posthog.capture('checkout_form_loaded', { plan, source, mode });
          }

          return data.clientSecret;
        } catch (error) {
          console.error('Error creating checkout session:', error);
          if (error.code === 'already-exists') {
            setState('has-subscription');
          } else {
            setErrorMessage(error.message || 'Could not start checkout.');
            setState('error');
          }
          throw error;
        }
      },
      onComplete: () => {
        setState('loading');
        startPolling();
      }
    }),
    [priceId, mode, metadata, plan, source, startPolling]
  );

  const handleOpenBillingPortal = async () => {
    try {
      const createBillingPortal = httpsCallable(
        functions,
        'createStripeBillingPortal'
      );
      const { data } = await createBillingPortal({
        return_url: window.location.href
      });
      if (data?.url) {
        window.open(data.url, '_blank');
      }
    } catch (error) {
      console.error('Error opening billing portal:', error);
    }
  };

  const handleSuccessClick = () => {
    onSuccess?.();
    onClose?.();
  };

  if (state === 'checkout') {
    return (
      <div className={styles.checkoutWrapper}>
        <EmbeddedCheckoutProvider
          stripe={getStripe()}
          options={checkoutOptions}
        >
          <StripeEmbeddedCheckout />
        </EmbeddedCheckoutProvider>
      </div>
    );
  }

  if (state === 'loading') return <LoadingView />;
  if (state === 'success') {
    return (
      <SuccessView
        title={successTitle}
        message={successMessage}
        ctaLabel={successCta}
        onCta={handleSuccessClick}
      />
    );
  }
  if (state === 'pending') return <PendingView onClose={onClose} />;
  if (state === 'error') {
    return <ErrorView message={errorMessage} onClose={onClose} />;
  }
  if (state === 'has-subscription') {
    return (
      <HasSubscriptionView
        onManage={handleOpenBillingPortal}
        onClose={onClose}
      />
    );
  }
  return null;
};

EmbeddedCheckout.propTypes = {
  priceId: PropTypes.string.isRequired,
  mode: PropTypes.oneOf(['subscription', 'payment']),
  source: PropTypes.string,
  plan: PropTypes.string,
  metadata: PropTypes.object,
  verifyPurchase: PropTypes.func,
  onSuccess: PropTypes.func,
  onClose: PropTypes.func,
  successTitle: PropTypes.string,
  successMessage: PropTypes.string,
  successCta: PropTypes.string
};

export default EmbeddedCheckout;
