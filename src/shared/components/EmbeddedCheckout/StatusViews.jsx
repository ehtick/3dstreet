/**
 * Post-payment status views rendered by EmbeddedCheckout.
 * Extracted as named components so each can be storied / tested in isolation
 * without driving the full Stripe state machine.
 */
import PropTypes from 'prop-types';
import styles from './EmbeddedCheckout.module.scss';

const SuccessIcon = () => (
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
);

const ErrorIcon = () => (
  <div className={styles.errorIcon}>
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
      <circle cx="12" cy="12" r="10"></circle>
      <line x1="12" y1="8" x2="12" y2="12"></line>
      <line x1="12" y1="16" x2="12.01" y2="16"></line>
    </svg>
  </div>
);

export const LoadingView = () => (
  <div className={styles.statusContainer}>
    <div className={styles.spinner}></div>
    <p>Processing your payment...</p>
    <p className={styles.subtext}>This usually takes just a few seconds</p>
  </div>
);

export const SuccessView = ({ title, message, ctaLabel, onCta }) => (
  <div className={styles.statusContainer}>
    <SuccessIcon />
    <h3>{title}</h3>
    <p>{message}</p>
    <button
      className={`${styles.actionButton} ${styles.success}`}
      onClick={onCta}
    >
      {ctaLabel}
    </button>
  </div>
);

SuccessView.propTypes = {
  title: PropTypes.string.isRequired,
  message: PropTypes.string.isRequired,
  ctaLabel: PropTypes.string.isRequired,
  onCta: PropTypes.func
};

// Webhook didn't land within the polling window. Don't claim success — say
// the payment is being finalized so the user knows to expect the email.
export const PendingView = ({ onClose }) => (
  <div className={styles.statusContainer}>
    <SuccessIcon />
    <h3>Almost there!</h3>
    <p>
      Your payment went through and we&apos;re finalizing your account. A
      confirmation email is on the way. Refresh in a minute to see your updated
      balance.
    </p>
    <button className={styles.actionButton} onClick={onClose}>
      Close
    </button>
  </div>
);

PendingView.propTypes = {
  onClose: PropTypes.func
};

export const ErrorView = ({ message, onClose }) => (
  <div className={styles.statusContainer}>
    <ErrorIcon />
    <h3>Payment Issue</h3>
    <p>
      {message ||
        'Something went wrong with your payment. Please try again or contact support.'}
    </p>
    <button className={styles.actionButton} onClick={onClose}>
      Close
    </button>
  </div>
);

ErrorView.propTypes = {
  message: PropTypes.string,
  onClose: PropTypes.func
};

export const HasSubscriptionView = ({ onManage, onClose }) => (
  <div className={styles.statusContainer}>
    <SuccessIcon />
    <h3>You Already Have an Active Subscription</h3>
    <p>
      To add more tokens, manage your subscription, or upgrade/downgrade, please
      visit the billing portal.
    </p>
    <button
      className={`${styles.actionButton} ${styles.primary}`}
      onClick={onManage}
    >
      Manage Subscription
    </button>
    <button className={styles.actionButton} onClick={onClose}>
      Close
    </button>
  </div>
);

HasSubscriptionView.propTypes = {
  onManage: PropTypes.func,
  onClose: PropTypes.func
};
