/**
 * Editor-side adapter around the shared UpgradeModal.
 * Wires up the editor's payment-modal store state, postCheckout chaining,
 * and the Pro-claim refresh that confirms a successful upgrade.
 */
import { useCallback } from 'react';
import UpgradeModal from '@shared/components/UpgradeModal';
import { useAuthContext } from '../contexts/index.js';
import { isUserPro } from '@shared/auth/api/user';
import { auth } from '@shared/services/firebase';
import useStore from '@/store';

const EditorUpgradeModal = () => {
  const { currentUser, setCurrentUser } = useAuthContext();
  const modal = useStore((state) => state.modal);
  const setModal = useStore((state) => state.setModal);
  const postCheckout = useStore((state) => state.postCheckout);
  const returnToPreviousModal = useStore(
    (state) => state.returnToPreviousModal
  );

  // Force a token refresh and re-check Pro status. Returns true once the
  // webhook flips the plan claim — keeps polling open until then so a
  // delayed webhook lands in the "still finalizing" state, not fake success.
  // Note: AuthContext's currentUser is a plain spread of the Firebase user,
  // so prototype methods like getIdToken aren't on it — use auth.currentUser.
  const verifyPurchase = useCallback(async () => {
    const firebaseUser = auth.currentUser;
    if (!firebaseUser || !currentUser) return false;
    try {
      await firebaseUser.getIdToken(true);
      const status = await isUserPro(firebaseUser);
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

  // Both close and success route through previousModal — set by
  // startCheckout — so bailing out OR completing payment lands the user
  // back at the modal that triggered the paywall (e.g. geo). Falls through
  // to modal=null when there's no previous (manual /upgrade entry, or the
  // signin chain consumed previousModal).
  const onClose = () => returnToPreviousModal();
  const onSuccess = () => returnToPreviousModal();

  // Fired when the modal opens (or returns from sign-in) and finds the user
  // is already Pro. The paywall-gated action (e.g. GLB export) was dropped
  // when they hit the paywall, so we can't auto-resume it — just dismiss
  // the modal and toast a hint to retry. Match the close routing so a
  // previous modal (geo, screenshot) is restored if there was one.
  const onAlreadyPro = () => {
    STREET.notify.successMessage(
      "You're already a Pro member — try that action again to continue."
    );
    returnToPreviousModal();
  };

  return (
    <UpgradeModal
      isOpen={modal === 'payment'}
      onClose={onClose}
      source={postCheckout || 'editor'}
      trigger={postCheckout ? `${postCheckout}_paywall` : 'manual'}
      verifyPurchase={verifyPurchase}
      // rememberPrevious=true so closing/completing sign-in lands the user
      // back in the upgrade modal where they started.
      onSignIn={() => setModal('signin', true)}
      onAlreadyPro={onAlreadyPro}
      onSuccess={onSuccess}
    />
  );
};

export default EditorUpgradeModal;
