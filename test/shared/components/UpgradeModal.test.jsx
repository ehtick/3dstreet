/**
 * UpgradeModal Component Tests
 *
 * Tests the shared upgrade modal used by both editor and generator:
 * - Visibility (controlled via isOpen prop)
 * - Pricing UI: title, feature list, billing toggle, price display
 * - Plan selection transitions to checkout state
 * - Has-subscription routing via checkActiveSubscriptions
 * - Close (button, overlay, escape)
 * - Body scroll lock
 *
 * Stripe / Firebase / posthog are mocked in test/setup.js.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { httpsCallable } from 'firebase/functions';
import UpgradeModal from '../../../src/shared/components/UpgradeModal';
import { AuthContext } from '@shared/contexts';

const renderModal = (props = {}, authValue = {}) => {
  const defaultProps = {
    isOpen: true,
    onClose: vi.fn(),
    source: 'test',
    ...props
  };

  const defaultAuth = {
    currentUser: {
      uid: 'test-user-123',
      email: 'test@example.com',
      getIdToken: () => Promise.resolve('mock-token')
    },
    tokenProfile: { genToken: 10, credToken: 0 },
    refreshTokenProfile: vi.fn(() => Promise.resolve()),
    isLoading: false,
    ...authValue
  };

  return {
    onClose: defaultProps.onClose,
    ...render(
      <AuthContext.Provider value={defaultAuth}>
        <UpgradeModal {...defaultProps} />
      </AuthContext.Provider>
    )
  };
};

describe('UpgradeModal', () => {
  beforeEach(() => {
    httpsCallable.mockReturnValue(() =>
      Promise.resolve({ data: { hasActiveSubscription: false } })
    );
  });

  describe('Visibility', () => {
    it('renders nothing when isOpen is false', () => {
      renderModal({ isOpen: false });
      expect(screen.queryByText('Upgrade to Pro')).not.toBeInTheDocument();
    });

    it('renders pricing view when isOpen is true', () => {
      renderModal();
      expect(screen.getByText('Upgrade to Pro')).toBeInTheDocument();
    });
  });

  describe('Pricing view', () => {
    it('shows title, subtitle, and Go Pro CTA', () => {
      renderModal();
      expect(screen.getByText('Upgrade to Pro')).toBeInTheDocument();
      expect(
        screen.getByText('Unlock the full 3DStreet toolkit.')
      ).toBeInTheDocument();
      expect(
        screen.getByRole('button', { name: 'Go Pro' })
      ).toBeInTheDocument();
    });

    it('shows the single feature list once (no duplication)', () => {
      renderModal();
      // Each feature should appear exactly once.
      expect(
        screen.getAllByText('Download JPEG snapshots without watermark')
      ).toHaveLength(1);
      expect(
        screen.getAllByText('100 AI generation tokens / month')
      ).toHaveLength(1);
    });

    it('defaults to yearly billing with $7/month and yearly subtext', () => {
      renderModal();
      expect(screen.getByText('$7')).toBeInTheDocument();
      expect(
        screen.getByText(/if billed yearly, \$84\/year/)
      ).toBeInTheDocument();
    });

    it('switches to monthly when Monthly toggle is clicked', async () => {
      const user = userEvent.setup();
      renderModal();

      await user.click(screen.getByRole('tab', { name: 'Monthly' }));

      expect(screen.getByText('$10')).toBeInTheDocument();
      expect(screen.queryByText(/if billed yearly/)).not.toBeInTheDocument();
    });

    it('shows Save 30% pill on the yearly toggle', () => {
      renderModal();
      expect(screen.getByText('Save 30%')).toBeInTheDocument();
    });

    it('shows Cancel anytime footer', () => {
      renderModal();
      expect(screen.getByText('Cancel anytime')).toBeInTheDocument();
    });
  });

  describe('Plan selection → checkout', () => {
    it('transitions to checkout state when Go Pro is clicked', async () => {
      const user = userEvent.setup();
      renderModal();

      await user.click(screen.getByRole('button', { name: 'Go Pro' }));

      await waitFor(() => {
        expect(screen.getByText('Complete your upgrade')).toBeInTheDocument();
      });
    });

    it('calls onCheckoutStart with the selected billing cycle', async () => {
      const user = userEvent.setup();
      const onCheckoutStart = vi.fn();
      renderModal({ onCheckoutStart });

      await user.click(screen.getByRole('button', { name: 'Go Pro' }));

      expect(onCheckoutStart).toHaveBeenCalledWith('yearly');
    });

    it('passes "monthly" to onCheckoutStart when Monthly is toggled', async () => {
      const user = userEvent.setup();
      const onCheckoutStart = vi.fn();
      renderModal({ onCheckoutStart });

      await user.click(screen.getByRole('tab', { name: 'Monthly' }));
      await user.click(screen.getByRole('button', { name: 'Go Pro' }));

      expect(onCheckoutStart).toHaveBeenCalledWith('monthly');
    });
  });

  describe('Checkout state', () => {
    it('shows back button that returns to pricing', async () => {
      const user = userEvent.setup();
      renderModal();

      await user.click(screen.getByRole('button', { name: 'Go Pro' }));

      const back = await screen.findByRole('button', { name: '← Back' });
      await user.click(back);

      expect(screen.getByText('Upgrade to Pro')).toBeInTheDocument();
    });
  });

  describe('Has-subscription routing', () => {
    it('routes to has-subscription view when user already subscribes', async () => {
      httpsCallable.mockReturnValue(() =>
        Promise.resolve({
          data: { hasActiveSubscription: true, subscriptionCount: 1 }
        })
      );

      renderModal();

      await waitFor(() => {
        expect(
          screen.getByText('You Already Have an Active Subscription')
        ).toBeInTheDocument();
      });
    });

    it('shows Manage Subscription button in has-subscription view', async () => {
      httpsCallable.mockReturnValue(() =>
        Promise.resolve({
          data: { hasActiveSubscription: true, subscriptionCount: 1 }
        })
      );

      renderModal();

      await waitFor(() => {
        expect(
          screen.getByRole('button', { name: 'Manage Subscription' })
        ).toBeInTheDocument();
      });
    });
  });

  describe('Close behavior', () => {
    it('calls onClose when close button is clicked', async () => {
      const user = userEvent.setup();
      const { onClose } = renderModal();

      await user.click(screen.getByRole('button', { name: /close/i }));

      expect(onClose).toHaveBeenCalled();
    });

    it('calls onClose when overlay is clicked', async () => {
      const user = userEvent.setup();
      const { container, onClose } = renderModal();

      const overlay = container.querySelector('[class*="modalOverlay"]');
      await user.click(overlay);

      expect(onClose).toHaveBeenCalled();
    });

    it('calls onClose on Escape key', () => {
      const { onClose } = renderModal();

      fireEvent.keyDown(document, { key: 'Escape' });

      expect(onClose).toHaveBeenCalled();
    });

    it('does not close when clicking modal content', async () => {
      const user = userEvent.setup();
      const { onClose } = renderModal();

      await user.click(screen.getByText('Upgrade to Pro'));

      expect(onClose).not.toHaveBeenCalled();
    });
  });

  describe('Body scroll lock', () => {
    it('locks body scroll while open', () => {
      renderModal();
      expect(document.body.style.overflow).toBe('hidden');
    });

    it('restores body scroll when closed', () => {
      const { rerender } = renderModal();
      expect(document.body.style.overflow).toBe('hidden');

      rerender(
        <AuthContext.Provider
          value={{
            currentUser: null,
            tokenProfile: null,
            refreshTokenProfile: vi.fn(),
            isLoading: false
          }}
        >
          <UpgradeModal isOpen={false} onClose={vi.fn()} />
        </AuthContext.Provider>
      );

      expect(document.body.style.overflow).toBe('');
    });
  });
});
