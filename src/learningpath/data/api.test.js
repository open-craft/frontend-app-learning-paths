import MockAdapter from 'axios-mock-adapter';
import { mergeConfig } from '@edx/frontend-platform';
import { initializeMockApp } from '@edx/frontend-platform/testing';
import { configure, AxiosJwtAuthService, getHttpClient } from '@edx/frontend-platform/auth';
import * as api from './api';

const path = 'path-v1:ORG+Path+2026';
const course = 'course-v1:ORG+Course+2026';
const base = 'https://lms.example.test';
const pathUrl = `${base}/api/learning_paths/v1/learning-paths/`;
const enrollmentUrl = `${base}/api/learning_paths/v1/${encodeURIComponent(path)}/enrollments/`;
const user = {
  userId: '7', username: 'learner+one', administrator: false, roles: [],
};
let service;
let browse;
let authenticated;

beforeEach(() => {
  mergeConfig({ LMS_BASE_URL: base, LOGIN_URL: `${base}/authn/login` });
  ({ authService: service } = initializeMockApp());
  browse = new MockAdapter(service.getHttpClient());
  authenticated = new MockAdapter(service.getAuthenticatedHttpClient());
  service.getAuthenticatedHttpClient.mockClear();
});

afterEach(() => { browse.restore(); authenticated.restore(); });

test('anonymous list and detail use the public client and encode the entire path key', async () => {
  browse.onGet(pathUrl).reply(200, { results: [{ key: path, display_name: 'Path' }] });
  browse.onGet(`${pathUrl}${encodeURIComponent(path)}/`).reply(200, { key: path });
  expect(await api.fetchLearningPaths()).toEqual([{ key: path, displayName: 'Path' }]);
  expect(await api.fetchLearningPathDetail(path)).toEqual({ key: path });
  expect(service.getAuthenticatedHttpClient).not.toHaveBeenCalled();
});

test('public course detail omits username; signed-in detail uses the authenticated client', async () => {
  const url = `${base}/api/courses/v1/courses/${encodeURIComponent(course)}/`;
  const data = {
    id: course, course_id: course, name: 'Course', media: { course_image: { uri: '/image' } },
  };
  browse.onGet(url).reply(200, data);
  expect((await api.fetchCourseDetails(course)).name).toBe('Course');
  expect(service.getAuthenticatedHttpClient).not.toHaveBeenCalled();
  service.setAuthenticatedUser(user);
  authenticated.onGet(`${url}?username=learner%2Bone`).reply(200, data);
  expect((await api.fetchCourseDetails(course)).id).toBe(course);
  expect(authenticated.history.get).toHaveLength(1);
});

test('visitors never request private dashboard, progress, organization, credential or enrollment APIs', async () => {
  expect(await api.fetchLearnerDashboard()).toEqual({ courses: [], emailConfirmation: {}, enterpriseDashboard: {} });
  expect(await api.fetchAllCourseCompletions()).toEqual([]);
  expect(await api.fetchOrganizations()).toEqual([]);
  expect(await api.fetchCredentialConfiguration(path)).toEqual({ hasCredentials: false, credentialCount: 0 });
  expect(await api.fetchCourseEnrollmentStatus(course)).toEqual({ isEnrolled: false });
  expect(service.getAuthenticatedHttpClient).not.toHaveBeenCalled();
  expect(browse.history.get).toHaveLength(0);
});

test.each([api.enrollInLearningPath, (key) => api.enrollInCourse(key, course)])(
  'anonymous enrollment redirects through native auth with the current page as next and sends no POST',
  async enroll => {
    window.history.replaceState({}, '', `/learningpath/${encodeURIComponent(path)}?tab=courses`);
    expect(await enroll(path)).toEqual({ success: false, requiresAuthentication: true });
    expect(service.redirectToLogin).toHaveBeenCalledWith(window.location.href);
    const next = new URL(service.getLoginRedirectUrl(window.location.href)).searchParams.get('next');
    expect(next).toBe(window.location.href);
    expect(authenticated.history.post).toHaveLength(0);
  },
);

test('two overlapping path enrollment calls share one request, then release after failure for retry', async () => {
  service.setAuthenticatedUser(user);
  let finish;
  authenticated.onPost(enrollmentUrl).reply(() => new Promise(resolve => { finish = resolve; }));
  const first = api.enrollInLearningPath(path);
  const second = api.enrollInLearningPath(path);
  expect(first).toBe(second);
  expect(authenticated.history.post).toHaveLength(1);
  finish([503, {}]);
  expect((await first).success).toBe(false);
  authenticated.onPost(enrollmentUrl).reply(201, {});
  expect(await api.enrollInLearningPath(path)).toEqual({ success: true, status: 201 });
  expect(authenticated.history.post).toHaveLength(2);
});

test('course enrollment encodes both segments and deduplicates only the same user/path/course', async () => {
  service.setAuthenticatedUser(user);
  let finish;
  const url = `${enrollmentUrl}${encodeURIComponent(course)}/`;
  authenticated.onPost(url).reply(() => new Promise(resolve => { finish = resolve; }));
  const first = api.enrollInCourse(path, course);
  expect(api.enrollInCourse(path, course)).toBe(first);
  service.setAuthenticatedUser({ ...user, username: 'other' });
  authenticated.onPost(url).reply(201, {});
  const second = api.enrollInCourse(path, course);
  expect(second).not.toBe(first);
  finish([201, {}]);
  await Promise.all([first, second]);
  expect(authenticated.history.post).toHaveLength(2);
});

test('signed-in reads retain authenticated selection and completion pagination', async () => {
  service.setAuthenticatedUser(user);
  authenticated.onGet(pathUrl).reply(200, []);
  authenticated.onGet(`${base}/completion-aggregator/v1/course/?username=learner%2Bone&page_size=10000&include_optional=true`)
    .reply(200, { results: [{ course_key: course, completion: { percent: 0.5 } }], pagination: { next: `${base}/page2` } });
  authenticated.onGet(`${base}/page2`).reply(200, { results: [] });
  expect(await api.fetchLearningPaths()).toEqual([]);
  expect(await api.fetchAllCourseCompletions()).toEqual([{ courseKey: course, completion: { percent: 0.5 } }]);
  expect(authenticated.history.get).toHaveLength(3);
  expect(browse.history.get).toHaveLength(0);
});

test('native AxiosJwtAuthService anonymous client performs public reads without a JWT refresh', async () => {
  configure(AxiosJwtAuthService, {
    config: {
      BASE_URL: 'https://apps.example.test',
      LMS_BASE_URL: base,
      LOGIN_URL: `${base}/authn/login`,
      LOGOUT_URL: `${base}/logout`,
      REFRESH_ACCESS_TOKEN_ENDPOINT: `${base}/login_refresh`,
      ACCESS_TOKEN_COOKIE_NAME: 'diagnostic_access',
      CSRF_TOKEN_API_PATH: '/csrf',
    },
    loggingService: { logError: jest.fn(), logInfo: jest.fn() },
    middleware: [],
  });
  const nativeClient = new MockAdapter(getHttpClient());
  nativeClient.onGet(pathUrl).reply(200, []);
  expect(await api.fetchLearningPaths()).toEqual([]);
  expect(nativeClient.history.get.map(request => request.url)).toEqual([pathUrl]);
  nativeClient.restore();
});
