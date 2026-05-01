/**
 * Tiny Zustand store for image generator
 * Just manages modal state for now
 */
import { create } from 'zustand';

const useImageGenStore = create((set, get) => ({
  modal: null,
  previousModal: null,
  // Pass rememberPrevious=true to enable the chain-back pattern (e.g. open
  // signin from upgrade modal, then return to upgrade after closing signin).
  setModal: (newModal, rememberPrevious = false) => {
    const currentModal = get().modal;
    if (rememberPrevious && currentModal) {
      set({ modal: newModal, previousModal: currentModal });
    } else {
      set({ modal: newModal });
    }
  },
  returnToPreviousModal: () => {
    const { previousModal } = get();
    if (previousModal) {
      set({ modal: previousModal, previousModal: null });
    } else {
      set({ modal: null });
    }
  }
}));

export default useImageGenStore;
