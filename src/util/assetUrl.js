import { getConfig } from '@edx/frontend-platform';

export function buildAssetUrl(assetPath) {
  const base = getConfig().LMS_BASE_URL || '';
  return `${base.replace(/\/+$/, '')}/${assetPath.replace(/^\/+/, '')}`;
}
