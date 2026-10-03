import { getHttpClient, getAuthenticatedHttpClient, getAuthenticatedUser } from '@edx/frontend-platform/auth';
import { getConfig, camelCaseObject } from '@edx/frontend-platform';
import { redirectToLogin } from '../utils';

const getBrowseClient = () => (getAuthenticatedUser() ? getAuthenticatedHttpClient() : getHttpClient());
const pendingEnrollments = new Map();

function privatePaginationOwner(user) {
  // Snapshot values: the native service may replace or mutate its user object.
  const { username, userId } = user;
  return () => {
    const current = getAuthenticatedUser();
    if (!current || current.username !== username || current.userId !== userId) {
      throw new Error('Learning Paths identity changed; retry under the current identity.');
    }
  };
}

function enrollOnce(pathSegments) {
  const user = getAuthenticatedUser();
  if (!user) {
    redirectToLogin();
    return Promise.resolve({ success: false, requiresAuthentication: true });
  }
  const key = JSON.stringify([user.username, ...pathSegments]);
  if (!pendingEnrollments.has(key)) {
    const url = `${getConfig().LMS_BASE_URL}/api/learning_paths/v1/${encodeURIComponent(pathSegments[0])}/enrollments/${pathSegments.length > 1 ? `${encodeURIComponent(pathSegments[1])}/` : ''}`;
    const request = getAuthenticatedHttpClient().post(url)
      .then(response => ({ success: true, status: response.status }))
      .catch(error => ({ success: false, status: error.response?.status, error }))
      .finally(() => pendingEnrollments.delete(key));
    pendingEnrollments.set(key, request);
  }
  return pendingEnrollments.get(key);
}

export async function fetchLearningPaths() {
  const client = getBrowseClient();
  // FIXME: This API has pagination.
  const response = await client.get(`${getConfig().LMS_BASE_URL}/api/learning_paths/v1/learning-paths/`);
  const data = response.data.results || response.data;
  return camelCaseObject(data);
}

export async function fetchLearningPathDetail(key) {
  const client = getBrowseClient();
  const response = await client.get(`${getConfig().LMS_BASE_URL}/api/learning_paths/v1/learning-paths/${encodeURIComponent(key)}/`);
  return camelCaseObject(response.data);
}

export async function fetchLearnerDashboard() {
  if (!getAuthenticatedUser()) {
    return { courses: [], emailConfirmation: {}, enterpriseDashboard: {} };
  }
  const response = await getAuthenticatedHttpClient().get(`${getConfig().LMS_BASE_URL}/api/learner_home/init/`);
  const courses = response.data.courses || [];
  const emailConfirmation = response.data.emailConfirmation || {};
  const enterpriseDashboard = response.data.enterpriseDashboard || {};

  const processedCourses = camelCaseObject(courses.map(course => {
    const { courseRun, course: courseInfo, enrollment } = course;

    return {
      id: courseRun.courseId,
      number: courseRun.courseId.split(':')[1].split('+')[1],
      org: courseRun.courseId.split(':')[1].split('+')[0],
      run: courseRun.courseId.split(':')[1].split('+')[2],
      name: courseInfo.courseName,
      shortDescription: null,
      endDate: courseRun.endDate,
      startDate: courseRun.startDate,
      courseImageAssetPath: courseInfo.bannerImgSrc,
      isStarted: courseRun.isStarted,
      isArchived: courseRun.isArchived,
      enrollmentDate: enrollment?.lastEnrolled || null,
      access: {
        isStaff: enrollment?.coursewareAccess?.isStaff || false,
        isTooEarly: enrollment?.coursewareAccess?.isTooEarly || false,
      },
    };
  }));

  return {
    courses: processedCourses,
    emailConfirmation: camelCaseObject(emailConfirmation),
    enterpriseDashboard: camelCaseObject(enterpriseDashboard),
  };
}

export async function fetchCourseDetails(courseId) {
  try {
    const user = getAuthenticatedUser();
    const query = user ? `?username=${encodeURIComponent(user.username)}` : '';
    const response = await getBrowseClient().get(
      `${getConfig().LMS_BASE_URL}/api/courses/v1/courses/${encodeURIComponent(courseId)}/${query}`,
    );
    const { data } = response;

    return camelCaseObject({
      id: data.course_id,
      number: data.number,
      org: data.org,
      run: data.id.split(':')[1].split('+')[2],
      name: data.name,
      shortDescription: data.short_description,
      endDate: data.end,
      startDate: data.start,
      courseImageAssetPath: data.media.course_image.uri,
      description: data.overview,
      selfPaced: data.pacing === 'self',
      duration: data.effort,
    });
  } catch (error) {
    if (error.response?.status === 404 || error.response?.status === 403) {
      return null;
    }
    throw error;
  }
}

export async function fetchAllCourseCompletions() {
  const user = getAuthenticatedUser();
  if (!user) { return []; }
  const requireOwner = privatePaginationOwner(user);
  const { username } = user;
  const client = getAuthenticatedHttpClient();

  let allResults = [];
  let nextUrl = `${getConfig().LMS_BASE_URL}/completion-aggregator/v1/course/?username=${encodeURIComponent(username)}&page_size=10000&include_optional=true`;

  while (nextUrl) {
    requireOwner();
    // eslint-disable-next-line no-await-in-loop
    const response = await client.get(nextUrl);
    const results = response.data.results || [];

    allResults = [...allResults, ...results];

    nextUrl = response.data.pagination?.next ? response.data.pagination.next : null;
  }

  return camelCaseObject(allResults.map(item => ({
    course_key: item.course_key,
    completion: item.completion,
    optional_completion: item.optional_completion,
  })));
}

export function enrollInLearningPath(learningPathId) {
  return enrollOnce([learningPathId]);
}

export function enrollInCourse(learningPathId, courseId) {
  return enrollOnce([learningPathId, courseId]);
}

export async function fetchCourseEnrollmentStatus(courseId) {
  if (!getAuthenticatedUser()) { return { isEnrolled: false }; }
  const client = getAuthenticatedHttpClient();
  try {
    const response = await client.get(
      `${getConfig().LMS_BASE_URL}/api/enrollment/v1/enrollment/${encodeURIComponent(courseId)}`,
    );
    return {
      isEnrolled: response.data?.is_active === true,
      data: camelCaseObject(response.data),
    };
  } catch (error) {
    // Handle API errors - they indicate the user is not enrolled.
    return {
      isEnrolled: false,
      error,
    };
  }
}

export async function fetchOrganizations() {
  const user = getAuthenticatedUser();
  if (!user) { return []; }
  const requireOwner = privatePaginationOwner(user);
  const client = getAuthenticatedHttpClient();

  let allResults = [];
  let nextUrl = `${getConfig().LMS_BASE_URL}/api/organizations/v0/organizations/?page_size=100`;

  while (nextUrl) {
    requireOwner();
    // eslint-disable-next-line no-await-in-loop
    const response = await client.get(nextUrl);
    const results = response.data.results || [];
    allResults = [...allResults, ...results];
    nextUrl = response.data.next || null;
  }

  return camelCaseObject(allResults.map(org => ({
    shortName: org.short_name,
    name: org.name,
    logo: org.logo,
  })));
}

export async function fetchCredentialConfiguration(learningContextKey) {
  if (!getAuthenticatedUser()) { return { hasCredentials: false, credentialCount: 0 }; }
  const client = getAuthenticatedHttpClient();
  try {
    const response = await client.get(
      `${getConfig().LMS_BASE_URL}/api/learning_credentials/v1/configured/${encodeURIComponent(learningContextKey)}/`,
    );
    return camelCaseObject(response.data);
  } catch (error) {
    return {
      hasCredentials: false,
      credentialCount: 0,
    };
  }
}
