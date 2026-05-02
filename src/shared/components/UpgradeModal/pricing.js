/**
 * Single source of truth for plan amounts shown in UpgradeModal +
 * paywallSurfaces feature lists. Keep these in sync with the server-side
 * allotment in public/functions/index.js (isAnnualPlan ? 840 : 100) — that
 * runs in a separate Firebase Functions deployment and can't share imports,
 * so any change here means a matching change there.
 */

// Local so cycleDetail and the exposed yearlyTotal field can't drift.
const yearlyTotal = 84;

export const PRICING = {
  monthly: {
    pricePerMonth: 10,
    tokens: 100,
    cycleDetail: 'billed monthly'
  },
  yearly: {
    pricePerMonth: 7,
    yearlyTotal,
    tokens: 840,
    cycleDetail: `billed yearly, $${yearlyTotal}/year`
  }
};

// Feature-list copy used across the modal and surface registry. Uses the
// monthly-plan figure; the up-front yearly grant (840) is communicated
// separately on the billing toggle row.
export const TOKEN_FEATURE_LINE = `${PRICING.monthly.tokens} AI generation tokens / month`;
