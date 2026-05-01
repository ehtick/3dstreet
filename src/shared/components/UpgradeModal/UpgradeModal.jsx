/**
 * UpgradeModal - shared Pro upgrade / token purchase modal.
 * Used by both the editor (Pro upgrade) and the generator (token top-ups).
 *
 * Owns: modal chrome, plan picker, checkActiveSubscriptions pre-check,
 * has-subscription routing. Delegates the actual Stripe form + post-payment
 * states to the shared EmbeddedCheckout component.
 *
 * Caller-specific concerns are passed via props:
 *  - verifyPurchase: how to confirm the webhook landed (Pro claim flip vs.
 *    token bump). Different for each app; fed through to EmbeddedCheckout.
 *  - onCheckoutStart: optional hook for the caller to snapshot state before
 *    payment (e.g. generator captures tokenProfile.genToken to compare against).
 *  - onSuccess: fires when the user clicks the success CTA — editor uses this
 *    to chain into a postCheckout modal (geo / image / etc.).
 */
import { useCallback, useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import { httpsCallable } from 'firebase/functions';
import posthog from 'posthog-js';
import { functions } from '@shared/services/firebase';
import { useAuthContext } from '@shared/contexts';
import EmbeddedCheckout from '@shared/components/EmbeddedCheckout';
import styles from './UpgradeModal.module.scss';

// Single source of truth for the Pro feature list — shown once, no duplication.
const PLAN_FEATURES = [
  'Download JPEG snapshots without watermark',
  'Unlimited geospatial maps & location changes',
  'HD renders, AR-ready glTF & video export',
  'Import custom 3D models & SVG / glTF files',
  '100 AI generation tokens / month'
];

const StarIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
  </svg>
);

const CheckIcon = () => (
  <svg
    className={styles.checkIcon}
    width="20"
    height="20"
    viewBox="0 0 24 24"
    fill="none"
  >
    <circle cx="12" cy="12" r="10" fill="#10b981" />
    <path
      d="M8 12.5l3 3 5-6"
      stroke="white"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const CloseIcon = () => (
  <svg
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <line x1="18" y1="6" x2="6" y2="18"></line>
    <line x1="6" y1="6" x2="18" y2="18"></line>
  </svg>
);

const UpgradeModal = ({
  isOpen,
  onClose,
  source = 'unknown',
  trigger = 'manual',
  onCheckoutStart,
  verifyPurchase,
  onSuccess,
  successTitle = 'Welcome to Pro!',
  successMessage = 'Pro features are unlocked on your account.',
  successCta = 'Continue'
}) => {
  const { currentUser } = useAuthContext();
  const [modalState, setModalState] = useState('pricing');
  // 'pricing' | 'checkout' | 'has-subscription'
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [billingCycle, setBillingCycle] = useState('yearly');
  // Annual highlighted by default — best value, matches mockup.
  const [subscriptionInfo, setSubscriptionInfo] = useState(null);

  const handleClose = useCallback(() => {
    onClose();
    setModalState('pricing');
    setSelectedPlan(null);
    setBillingCycle('yearly');
    setSubscriptionInfo(null);
  }, [onClose]);

  const handleGoPro = () => {
    const plan = billingCycle; // 'monthly' | 'yearly'
    setSelectedPlan(plan);
    setModalState('checkout');
    onCheckoutStart?.(plan);
    posthog.capture('checkout_started', { plan, source });
  };

  const handleBackToPricing = () => {
    setModalState('pricing');
    setSelectedPlan(null);
  };

  // Pre-check for an existing subscription so we can route to billing portal
  // before showing pricing — avoids duplicate purchases. Only fire the
  // pricing_page_viewed event once we confirm the user actually sees the
  // pricing UI (otherwise has-subscription users skew the funnel).
  useEffect(() => {
    if (!isOpen || !currentUser) return;

    const checkSubscriptions = async () => {
      try {
        const checkActiveSubscriptions = httpsCallable(
          functions,
          'checkActiveSubscriptions'
        );
        const { data } = await checkActiveSubscriptions();
        if (data.hasActiveSubscription) {
          setSubscriptionInfo(data);
          setModalState('has-subscription');
          return;
        }
      } catch (error) {
        console.error('Error checking active subscriptions:', error);
        // Fall through to firing the event — better to over-count by a
        // failed check than to silently drop valid pricing impressions.
      }
      posthog.capture('pricing_page_viewed', { source, trigger });
    };

    checkSubscriptions();
  }, [isOpen, currentUser, source, trigger]);

  // Defensive: clear any stray session_id left in the URL.
  useEffect(() => {
    if (!isOpen) return;
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.has('session_id')) {
      window.history.replaceState({}, '', window.location.pathname);
    }
  }, [isOpen]);

  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape' && isOpen) {
        handleClose();
      }
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, handleClose]);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const handleOpenBillingPortal = async () => {
    try {
      const createBillingPortal = httpsCallable(
        functions,
        'createStripeBillingPortal'
      );
      const { data } = await createBillingPortal({
        return_url: window.location.href
      });
      if (data?.url) window.open(data.url, '_blank');
    } catch (error) {
      console.error('Error opening billing portal:', error);
    }
  };

  const renderPricing = () => (
    <>
      <div className={styles.pricingHeader}>
        <div className={styles.headerIcon}>
          <StarIcon />
        </div>
        <button
          className={styles.closeButton}
          onClick={handleClose}
          aria-label="Close"
        >
          <CloseIcon />
        </button>
      </div>

      <div className={styles.pricingTitleBlock}>
        <h2 className={styles.pricingTitle}>Upgrade to Pro</h2>
        <p className={styles.pricingSubtitle}>
          Unlock the full 3DStreet toolkit.
        </p>
      </div>

      <div className={styles.divider} />

      <ul className={styles.featureList}>
        {PLAN_FEATURES.map((f) => (
          <li key={f}>
            <CheckIcon />
            <span>{f}</span>
          </li>
        ))}
      </ul>

      <div className={styles.billingToggle} role="tablist">
        <button
          type="button"
          role="tab"
          aria-selected={billingCycle === 'monthly'}
          className={`${styles.toggleButton} ${billingCycle === 'monthly' ? styles.toggleActive : ''}`}
          onClick={() => setBillingCycle('monthly')}
        >
          Monthly
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={billingCycle === 'yearly'}
          className={`${styles.toggleButton} ${billingCycle === 'yearly' ? styles.toggleActive : ''}`}
          onClick={() => setBillingCycle('yearly')}
        >
          Yearly <span className={styles.savePill}>Save 30%</span>
        </button>
      </div>

      <div className={styles.priceDisplay}>
        <span className={styles.priceLarge}>
          ${billingCycle === 'yearly' ? '7' : '10'}
        </span>
        <span className={styles.pricePer}>/month</span>
        {billingCycle === 'yearly' && (
          <div className={styles.priceSubtext}>if billed yearly, $84/year</div>
        )}
      </div>

      <button type="button" className={styles.ctaButton} onClick={handleGoPro}>
        Go Pro
      </button>

      <p className={styles.footerNote}>Cancel anytime</p>
    </>
  );

  const renderCheckout = () => (
    <>
      <div className={styles.modalHeader}>
        <button className={styles.backButton} onClick={handleBackToPricing}>
          ← Back
        </button>
        <h2 className={styles.modalTitle}>Complete your upgrade</h2>
        <button
          className={styles.closeButton}
          onClick={handleClose}
          aria-label="Close"
        >
          <CloseIcon />
        </button>
      </div>

      <EmbeddedCheckout
        priceId={
          selectedPlan === 'monthly'
            ? process.env.STRIPE_MONTHLY_PRICE_ID
            : process.env.STRIPE_YEARLY_PRICE_ID
        }
        mode="subscription"
        source={source}
        plan={selectedPlan}
        verifyPurchase={verifyPurchase}
        onSuccess={onSuccess}
        onClose={handleClose}
        successTitle={successTitle}
        successMessage={successMessage}
        successCta={successCta}
      />
    </>
  );

  const renderHasSubscription = () => (
    <>
      <div className={styles.modalHeader}>
        <h2 className={styles.modalTitle}>Active Subscription</h2>
        <button
          className={styles.closeButton}
          onClick={handleClose}
          aria-label="Close"
        >
          <CloseIcon />
        </button>
      </div>

      <div className={styles.statusContainer}>
        <div className={styles.successIcon}>
          <svg
            width="64"
            height="64"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
            <polyline points="22 4 12 14.01 9 11.01"></polyline>
          </svg>
        </div>
        <h3>You Already Have an Active Subscription</h3>
        <p>
          You currently have {subscriptionInfo?.subscriptionCount || 1} active
          subscription{subscriptionInfo?.subscriptionCount > 1 ? 's' : ''}.
        </p>
        {subscriptionInfo?.subscriptionCount > 1 && (
          <p className={styles.subtext}>
            Note: You have multiple subscriptions. Please manage them through
            the billing portal.
          </p>
        )}
        <p className={styles.subtext}>
          To add more tokens, manage your subscription, or upgrade/downgrade,
          please visit the billing portal.
        </p>
        <button className={styles.ctaButton} onClick={handleOpenBillingPortal}>
          Manage Subscription
        </button>
        <button className={styles.ctaButtonSecondary} onClick={handleClose}>
          Close
        </button>
      </div>
    </>
  );

  return (
    <div className={styles.modalOverlay} onClick={handleClose}>
      <div
        className={`${styles.modalContent} ${modalState === 'checkout' ? styles.modalContentWide : ''}`}
        onClick={(e) => e.stopPropagation()}
      >
        {modalState === 'pricing' && renderPricing()}
        {modalState === 'checkout' && selectedPlan && renderCheckout()}
        {modalState === 'has-subscription' && renderHasSubscription()}
      </div>
    </div>
  );
};

UpgradeModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  source: PropTypes.string,
  trigger: PropTypes.string,
  onCheckoutStart: PropTypes.func,
  verifyPurchase: PropTypes.func,
  onSuccess: PropTypes.func,
  successTitle: PropTypes.string,
  successMessage: PropTypes.string,
  successCta: PropTypes.string
};

export default UpgradeModal;
