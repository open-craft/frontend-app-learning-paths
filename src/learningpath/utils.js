import { redirectToLogin as platformRedirectToLogin } from '@edx/frontend-platform/auth';
import { getConfig } from '@edx/frontend-platform';

/**
 * Builds a URL to the course home page in the learning MFE.
 * @param {string} courseId - The course id.
 * @returns {string} URL to the course home page.
 */
export const buildCourseHomeUrl = (courseId) => {
  const learningMfeBase = getConfig().LEARNING_BASE_URL;
  const trimmedBase = learningMfeBase.replace(/\/$/, '');
  const sanitizedBase = trimmedBase.endsWith('/learning')
    ? trimmedBase
    : `${trimmedBase}/learning`;
  return `${sanitizedBase}/course/${courseId}/home`;
};

/** Use the native auth redirect and retain the current LP page as the return target. */
export const redirectToLogin = () => platformRedirectToLogin(window.location.href);
