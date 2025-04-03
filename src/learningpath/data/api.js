import { getAuthenticatedHttpClient, getAuthenticatedUser } from '@edx/frontend-platform/auth';
import { getConfig } from '@edx/frontend-platform';

export async function fetchLearningPaths() {
  const client = getAuthenticatedHttpClient();
  const response = await client.get(`${getConfig().LMS_BASE_URL}/api/learning_paths/v1/learning-paths/`);
  return response.data.results || response.data;
}

export async function fetchLearningPathDetail(key) {
  const client = getAuthenticatedHttpClient();
  const response = await client.get(`${getConfig().LMS_BASE_URL}/api/learning_paths/v1/learning-paths/${key}/`);
  return response.data;
}

export async function fetchLearningPathProgress(key) {
  const client = getAuthenticatedHttpClient();
  const response = await client.get(`${getConfig().LMS_BASE_URL}/api/learning_paths/v1/${key}/progress/`);
  return response.data;
}

export async function fetchCourses(courseId) {
  const client = getAuthenticatedHttpClient();
  let url;
  if (courseId) {
    url = `${getConfig().LMS_BASE_URL}/api/courses/v1/courses/${encodeURIComponent(courseId)}/`;
  } else {
    url = `${getConfig().LMS_BASE_URL}/api/courses/v1/courses/`;
  }
  const response = await client.get(url);
  if (courseId) {
    const course = response.data;
    return {
      course_id: course.course_id,
      name: course.name,
    };
  }
  return (response.data.results || []).map(course => ({
    course_id: course.course_id,
    name: course.name,
  }));
}

export async function fetchCourseDetails(courseId) {
  const client = getAuthenticatedHttpClient();
  const response = await client.get(
    `${getConfig().STUDIO_BASE_URL}/api/contentstore/v1/course_details/${encodeURIComponent(courseId)}`,
  );
  return response.data;
}

export async function fetchAllCourseDetails() {
  const courses = await fetchCourses();
  const details = await Promise.all(
    courses.map(course => fetchCourseDetails(course.course_id).then(detail => ({
      ...detail,
      name: course.name,
    }))),
  );
  return details;
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

export async function fetchCombinedCourseInfo(courseId) {
  const basicInfo = await fetchCourses(courseId);
  const details = await fetchCourseDetails(courseId);
  return {
    ...basicInfo,
    ...details,
  };
}

export async function fetchCoursesByIds(courseIds) {
  const combined = await Promise.all(
    courseIds.map(async (courseId) => {
      const combinedInfo = await fetchCombinedCourseInfo(courseId);
      const percent = await fetchCourseCompletion(courseId);
      let status = 'In progress';
      if (percent === 0.0) {
        status = 'Not started';
      } else if (percent === 100.0) {
        status = 'Completed';
      }
      return {
        ...combinedInfo,
        status,
        percent,
      };
    }),
  );
  return combined;
}
