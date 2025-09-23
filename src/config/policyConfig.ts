export interface PolicyConfig {
  termsVersion: string;
  privacyVersion: string;
  termsUrl: string;
  privacyUrl: string;
  lastUpdated: string;
}

export const POLICY_CONFIG: PolicyConfig = {
  termsVersion: '1.0.0',
  privacyVersion: '1.0.0',
  termsUrl: '/terms-and-conditions.html',
  privacyUrl: '/privacy-policy.html',
  lastUpdated: '2025-01-27',
};