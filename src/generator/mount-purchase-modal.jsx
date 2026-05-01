/**
 * Mount the shared UpgradeModal for the generator.
 * Generator-specific bits (token-bump verification, generator store hookup)
 * are wired here; the modal UI itself lives in @shared/components/UpgradeModal.
 */
import { useCallback, useRef } from 'react';
import { createRoot } from 'react-dom/client';
import { AuthProvider, useAuthContext } from '../editor/contexts';
import UpgradeModal from '@shared/components/UpgradeModal';
import { getTokenProfile } from '@shared/utils/tokens';
import useImageGenStore from './store.js';

const GeneratorUpgradeModal = () => {
  const { modal, setModal } = useImageGenStore();
  const { currentUser, tokenProfile } = useAuthContext();
  // Snapshot of genToken at the moment the user clicked subscribe; the
  // webhook will bump this once payment lands, which is what we poll for.
  const initialTokenCount = useRef(0);

  const handleCheckoutStart = useCallback(() => {
    initialTokenCount.current = tokenProfile?.genToken || 0;
  }, [tokenProfile]);

  const verifyPurchase = useCallback(async () => {
    if (!currentUser?.uid) return false;
    const fresh = await getTokenProfile(currentUser.uid);
    const current = fresh?.genToken || 0;
    if (current > initialTokenCount.current) {
      // Refresh other components (TokenDisplay, etc.).
      window.dispatchEvent(new Event('tokenCountChanged'));
      return true;
    }
    return false;
  }, [currentUser]);

  return (
    <UpgradeModal
      isOpen={modal === 'purchase'}
      onClose={() => setModal(null)}
      source="generator"
      trigger="gen_token_limit"
      onCheckoutStart={handleCheckoutStart}
      onSignIn={() => setModal('signin')}
      verifyPurchase={verifyPurchase}
      successTitle="Welcome to Pro!"
      successMessage="Your tokens are ready — happy generating."
      successCta="Start Generating"
    />
  );
};

export const mountPurchaseModal = () => {
  let modalRoot = document.getElementById('purchase-modal-root');
  if (!modalRoot) {
    modalRoot = document.createElement('div');
    modalRoot.id = 'purchase-modal-root';
    document.body.appendChild(modalRoot);
  }

  const root = createRoot(modalRoot);
  root.render(
    <AuthProvider>
      <GeneratorUpgradeModal />
    </AuthProvider>
  );

  window.addEventListener('openPurchaseModal', () => {
    useImageGenStore.getState().setModal('purchase');
  });
};

export default mountPurchaseModal;
