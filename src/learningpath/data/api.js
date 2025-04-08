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

export async function fetchLearningPathProgress(key) {
  const client = getAuthenticatedHttpClient();
  const response = await client.get(`${getConfig().LMS_BASE_URL}/api/learning_paths/v1/${key}/progress/`);
  return camelCaseObject(response.data);
}

export async function fetchCourses(courseId) {
  const client = getAuthenticatedHttpClient();
  let url;
  if (courseId) {
    // FIXME: This returns 404 when `COURSE_CATALOG_VISIBILITY_PERMISSION` is not set to `about` or `both` for a course.
    url = `${getConfig().LMS_BASE_URL}/api/courses/v1/courses/${encodeURIComponent(courseId)}/`;
  } else {
    // FIXME: This API has pagination.
    url = `${getConfig().LMS_BASE_URL}/api/courses/v1/courses/`;
  }
  const response = await client.get(url);
  if (courseId) {
    const course = response.data;
    return camelCaseObject({
      course_id: course.course_id,
      name: course.name,
    });
  }
  return camelCaseObject((response.data.results || []).map(course => ({
    course_id: course.course_id,
    name: course.name,
  })));
}

export async function fetchCourseDetails(courseId) {
  const client = getAuthenticatedHttpClient();
  // FIXME: Non-staff users cannot use this API.
  const response = await client.get(
    `${getConfig().STUDIO_BASE_URL}/api/contentstore/v1/course_details/${encodeURIComponent(courseId)}`,
  );
  return camelCaseObject(response.data);
}

export async function fetchAllCourseDetails() {
  const courses = await fetchCourses();
  const details = await Promise.all(
    courses.map(course => fetchCourseDetails(course.courseId).then(detail => ({
      ...detail,
      name: course.name,
    }))),
  );
  return camelCaseObject(details);
}

export async function fetchCourseCompletion(courseId) {
  const { username } = getAuthenticatedUser();
  const client = getAuthenticatedHttpClient();
  const response = await client.get(
    `${getConfig().LMS_BASE_URL}/completion-aggregator/v1/course/${encodeURIComponent(courseId)}/?username=${username}`,
  );
  if (response.data.results && response.data.results.length > 0) {
    return response.data.results[0].completion.percent;
  }
  return 0.0;
}

export async function fetchAllCourseCompletions() {
  const client = getAuthenticatedHttpClient();

  let allResults = [];
  let nextUrl = `${getConfig().LMS_BASE_URL}/completion-aggregator/v1/course/?page_size=10000`;

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

export async function fetchCombinedCourseInfo(courseId) {
  const basicInfo = await fetchCourses(courseId);
  const details = await fetchCourseDetails(courseId);
  return camelCaseObject({
    ...basicInfo,
    ...details,
  });
}

export async function fetchCoursesByIds(courseIds, completions = {}) {
  const combined = await Promise.all(
    courseIds.map(async (courseId) => {
      const combinedInfo = await fetchCombinedCourseInfo(courseId);

      let percent = 0;
      if (completions[courseId]?.percent !== undefined) {
        percent = completions[courseId].percent;
      } else {
        percent = await fetchCourseCompletion(courseId);
      }

      let status = 'In progress';
      if (percent <= 0.0) {
        status = 'Not started';
      } else if (percent >= 1.0) {
        status = 'Completed';
      }

      return camelCaseObject({
        ...combinedInfo,
        status,
        percent,
      });
    }),
  );
  return combined;
}
