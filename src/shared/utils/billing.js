import { httpsCallable } from 'firebase/functions';
import { functions } from '@shared/services/firebase';

export const openBillingPortal = async ({
  returnUrl = window.location.href,
  target = '_blank'
} = {}) => {
  try {
    const createBillingPortal = httpsCallable(
      functions,
      'createStripeBillingPortal'
    );
    const { data } = await createBillingPortal({ return_url: returnUrl });
    if (!data?.url) return null;
    if (target === '_self') {
      window.location.href = data.url;
    } else {
      window.open(data.url, target);
    }
    return data.url;
  } catch (error) {
    console.error('Error opening billing portal:', error);
    return null;
  }
};
