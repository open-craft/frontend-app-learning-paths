import { getAuthenticatedHttpClient, getAuthenticatedUser } from '@edx/frontend-platform/auth';
import { getConfig, camelCaseObject } from '@edx/frontend-platform';

export async function fetchLearningPaths() {
  const client = getAuthenticatedHttpClient();
  // FIXME: This API has pagination.
  const response = await client.get(`${getConfig().LMS_BASE_URL}/api/learning_paths/v1/learning-paths/`);
  const data = response.data.results || response.data;
  return camelCaseObject(data);
}

export async function fetchLearningPathDetail(key) {
  const client = getAuthenticatedHttpClient();
  const response = await client.get(`${getConfig().LMS_BASE_URL}/api/learning_paths/v1/learning-paths/${key}/`);
  return camelCaseObject(response.data);
}

export async function fetchCourses() {
  const response = await getAuthenticatedHttpClient().get(`${getConfig().LMS_BASE_URL}/api/learner_home/init/`);
  const courses = response.data.courses || [];

  return camelCaseObject(courses.map(course => {
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
    };
  }));
}

export async function fetchCourseDetails(courseId) {
  const response = await getAuthenticatedHttpClient().get(
    `${getConfig().LMS_BASE_URL}/api/courses/v1/courses/${encodeURIComponent(courseId)}/`,
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
}

export async function fetchCourseCompletion(courseId) {
  try {
    const { username } = getAuthenticatedUser();
    const client = getAuthenticatedHttpClient();
    const response = await client.get(
      `${getConfig().LMS_BASE_URL}/completion-aggregator/v1/course/${encodeURIComponent(courseId)}/?username=${username}`,
    );
    return response.data.results?.[0]?.completion?.percent ?? 0.0;
  } catch (error) {
    // Handle API errors - they indicate the user is not enrolled or did not complete any XBlocks.
    return 0.0;
  }
}

export async function fetchAllCourseCompletions() {
  const { username } = getAuthenticatedUser();
  const client = getAuthenticatedHttpClient();

  let allResults = [];
  let nextUrl = `${getConfig().LMS_BASE_URL}/completion-aggregator/v1/course/?username=${username}&page_size=10000`;

  while (nextUrl) {
    // eslint-disable-next-line no-await-in-loop
    const response = await client.get(nextUrl);
    const results = response.data.results || [];

    allResults = [...allResults, ...results];

    nextUrl = response.data.pagination?.next ? response.data.pagination.next : null;
  }

  return camelCaseObject(allResults.map(item => ({
    course_key: item.course_key,
    completion: item.completion,
  })));
}

export async function enrollInLearningPath(learningPathId) {
  const client = getAuthenticatedHttpClient();
  try {
    const response = await client.post(
      `${getConfig().LMS_BASE_URL}/api/learning_paths/v1/${learningPathId}/enrollments/`,
    );
    return {
      success: true,
      status: response.status,
    };
  } catch (error) {
    return {
      success: false,
      status: error.response?.status,
      error,
    };
  }
}

export async function enrollInCourse(learningPathId, courseId) {
  const client = getAuthenticatedHttpClient();
  try {
    const response = await client.post(
      `${getConfig().LMS_BASE_URL}/api/learning_paths/v1/${learningPathId}/enrollments/${courseId}/`,
    );
    return {
      success: true,
      status: response.status,
    };
  } catch (error) {
    return {
      success: false,
      status: error.response?.status,
      error,
    };
  }
}

export async function fetchCourseEnrollmentStatus(courseId) {
  const client = getAuthenticatedHttpClient();
  try {
    const response = await client.get(
      `${getConfig().LMS_BASE_URL}/api/enrollment/v1/enrollment/${courseId}`,
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
  const client = getAuthenticatedHttpClient();

  let allResults = [];
  let nextUrl = `${getConfig().LMS_BASE_URL}/api/organizations/v0/organizations/?page_size=100`;

  while (nextUrl) {
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
