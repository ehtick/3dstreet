/**
 * Editor-side adapter around the shared UpgradeModal.
 * Wires up the editor's payment-modal store state, postCheckout chaining,
 * and the Pro-claim refresh that confirms a successful upgrade.
 */
import { useCallback } from 'react';
import UpgradeModal from '@shared/components/UpgradeModal';
import { useAuthContext } from '../contexts/index.js';
import { isUserPro } from '@shared/auth/api/user';
import useStore from '@/store';

const EditorUpgradeModal = () => {
  const { currentUser, setCurrentUser } = useAuthContext();
  const modal = useStore((state) => state.modal);
  const setModal = useStore((state) => state.setModal);
  const postCheckout = useStore((state) => state.postCheckout);

  // Force a token refresh and re-check Pro status. Returns true once the
  // webhook flips the plan claim — keeps polling open until then so a
  // delayed webhook lands in the "still finalizing" state, not fake success.
  const verifyPurchase = useCallback(async () => {
    if (!currentUser) return false;
    try {
      await currentUser.getIdToken(true);
      const status = await isUserPro(currentUser);
      if (status?.isPro) {
        setCurrentUser({
          ...currentUser,
          isPro: true,
          isProTeam: status.isProTeam,
          teamDomain: status.teamDomain
        });
        return true;
      }
    } catch (error) {
      console.error('Error verifying Pro status:', error);
    }
    return false;
  }, [currentUser, setCurrentUser]);

  const onClose = () => setModal(null);

  // After the user clicks the success CTA, route them back to whatever
  // they were trying to do that triggered the paywall (geo modal, etc.).
  const onSuccess = () => {
    if (postCheckout) {
      setModal(postCheckout);
    } else {
      setModal(null);
    }
  };

  return (
    <UpgradeModal
      isOpen={modal === 'payment'}
      onClose={onClose}
      source={postCheckout || 'editor'}
      trigger={postCheckout ? `${postCheckout}_paywall` : 'manual'}
      verifyPurchase={verifyPurchase}
      onSignIn={() => setModal('signin')}
      onSuccess={onSuccess}
    />
  );
};

export default EditorUpgradeModal;
