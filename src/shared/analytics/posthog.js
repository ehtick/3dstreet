import posthog from 'posthog-js';

const POSTHOG_TOKEN = 'phc_Yclai3qykyFi8AEFOrZsh6aS78SSooLzpDz9wQ9YAH9';

export function initPostHog() {
  if (process.env.NODE_ENV === 'development') return;
  posthog.init(POSTHOG_TOKEN, {
    api_host: 'https://us.i.posthog.com',
    person_profiles: 'identified_only'
  });
}
