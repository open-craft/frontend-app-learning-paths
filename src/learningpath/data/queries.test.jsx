import React, { useMemo } from 'react';
import PropTypes from 'prop-types';
import { act, renderHook, waitFor } from '@testing-library/react';
import { AppContext } from '@edx/frontend-platform/react';
import { initializeMockApp } from '@edx/frontend-platform/testing';
import MockAdapter from 'axios-mock-adapter';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { mergeConfig } from '@edx/frontend-platform';
import {
  getQueryKeys, useLearningPaths, useLearnerDashboard, useOrganizations,
  useCredentialConfiguration, useCourseEnrollmentStatus, useEnrollLearningPath, useCoursesByIds,
} from './queries';

const path = 'path-v1:ORG+Path+2026';
const course = 'course-v1:ORG+Course+2026';
const base = 'https://lms.example.test';
const user = {
  userId: '7', username: 'learner', roles: [], administrator: false,
};
let client;
let service;
let browse;
let authenticated;
let principal;

const Wrapper = ({ children }) => {
  const currentPrincipal = principal;
  const value = useMemo(() => ({ authenticatedUser: currentPrincipal }), [currentPrincipal]);
  return (
    <AppContext.Provider value={value}>
      <QueryClientProvider client={client}>{children}</QueryClientProvider>
    </AppContext.Provider>
  );
};

Wrapper.propTypes = { children: PropTypes.node.isRequired };

beforeEach(() => {
  principal = null;
  mergeConfig({ LMS_BASE_URL: base });
  ({ authService: service } = initializeMockApp());
  client = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } });
  browse = new MockAdapter(service.getHttpClient());
  authenticated = new MockAdapter(service.getAuthenticatedHttpClient());
});

afterEach(() => { client.clear(); browse.restore(); authenticated.restore(); });

test('anonymous list and public course detail settle while all private hooks remain idle', async () => {
  browse.onGet(`${base}/api/learning_paths/v1/learning-paths/`).reply(200, [{
    key: path, display_name: 'Public path', steps: [{ course_key: course }],
  }]);
  browse.onGet(`${base}/api/courses/v1/courses/${encodeURIComponent(course)}/`).reply(200, {
    id: course, course_id: course, name: 'Public course', media: { course_image: { uri: '/image' } },
  });
  const { result } = renderHook(() => ({
    paths: useLearningPaths(),
    dashboard: useLearnerDashboard(),
    organizations: useOrganizations(),
    credentials: useCredentialConfiguration(path),
    enrollment: useCourseEnrollmentStatus(course),
    courses: useCoursesByIds([course]),
  }), { wrapper: Wrapper });
  await waitFor(() => expect(result.current.paths.isSuccess).toBe(true));
  await waitFor(() => expect(result.current.courses.isSuccess).toBe(true));
  expect(result.current.paths.data[0]).toMatchObject({ displayName: 'Public path', percent: 0, status: 'Not started' });
  expect(result.current.courses.data[0]).toMatchObject({ name: 'Public course', percent: 0 });
  ['dashboard', 'organizations', 'credentials', 'enrollment'].forEach(key => {
    expect(result.current[key].fetchStatus).toBe('idle');
    expect(result.current[key].isLoading).toBe(false);
  });
  expect(authenticated.history.get).toHaveLength(0);
});

test('signed-in and anonymous cache entries cannot share enrollment or completion state', async () => {
  principal = user;
  service.setAuthenticatedUser(user);
  client.setQueryData(getQueryKeys(user.username).ALL_LEARNING_PATHS, [{ key: path, percent: 1, enrollmentDate: 'private' }]);
  browse.onGet(`${base}/api/learning_paths/v1/learning-paths/`).reply(200, [{ key: path, steps: [] }]);
  const { result, rerender } = renderHook(useLearningPaths, { wrapper: Wrapper });
  expect(result.current.data[0].enrollmentDate).toBe('private');
  act(() => { principal = null; service.setAuthenticatedUser(null); rerender(); });
  await waitFor(() => expect(result.current.isSuccess).toBe(true));
  expect(result.current.data[0].enrollmentDate).toBeUndefined();
  expect(result.current.data[0].percent).toBe(0);
  expect(client.getQueryData(getQueryKeys(user.username).ALL_LEARNING_PATHS)[0].enrollmentDate).toBe('private');
});

test.each([null, user])('failed or anonymous mutation never marks a path enrolled (principal %s)', async identity => {
  principal = identity;
  service.setAuthenticatedUser(identity);
  const keys = getQueryKeys(identity?.username || null);
  client.setQueryData(keys.LEARNING_PATH_DETAIL(path), { key: path, enrollmentDate: null });
  client.setQueryData(keys.ALL_LEARNING_PATHS, [{ key: path, enrollmentDate: null }]);
  authenticated.onPost().reply(403, {});
  const { result } = renderHook(useEnrollLearningPath, { wrapper: Wrapper });
  await act(async () => { await result.current.mutateAsync(path); });
  expect(client.getQueryData(keys.LEARNING_PATH_DETAIL(path)).enrollmentDate).toBeNull();
  expect(client.getQueryData(keys.ALL_LEARNING_PATHS)[0].enrollmentDate).toBeNull();
});

test('a pending mutation finishing after an identity change writes only its original user cache', async () => {
  principal = user;
  service.setAuthenticatedUser(user);
  const original = getQueryKeys(user.username);
  const other = getQueryKeys('other');
  [original, other].forEach(keys => {
    client.setQueryData(keys.LEARNING_PATH_DETAIL(path), { key: path, enrollmentDate: null });
    client.setQueryData(keys.ALL_LEARNING_PATHS, [{ key: path, enrollmentDate: null }]);
  });
  let finish;
  authenticated.onPost().reply(() => new Promise(resolve => { finish = resolve; }));
  const { result, rerender } = renderHook(useEnrollLearningPath, { wrapper: Wrapper });
  let pending;
  act(() => { pending = result.current.mutateAsync(path); });
  await waitFor(() => expect(authenticated.history.post).toHaveLength(1));
  act(() => { principal = { ...user, username: 'other' }; service.setAuthenticatedUser(principal); rerender(); });
  await act(async () => { finish([201, {}]); await pending; });
  expect(client.getQueryData(original.LEARNING_PATH_DETAIL(path)).enrollmentDate).toEqual(expect.any(Number));
  expect(client.getQueryData(other.LEARNING_PATH_DETAIL(path)).enrollmentDate).toBeNull();
  expect(client.getQueryData(other.ALL_LEARNING_PATHS)[0].enrollmentDate).toBeNull();
});

test('a queued click cannot enroll a different identity before the native mutation begins', async () => {
  principal = user;
  service.setAuthenticatedUser(user);
  authenticated.onPost().reply(201, {});
  const { result } = renderHook(useEnrollLearningPath, { wrapper: Wrapper });
  let pending;
  act(() => {
    pending = result.current.mutateAsync(path);
    service.setAuthenticatedUser({ ...user, username: 'other' });
  });
  await act(async () => {
    await expect(pending).rejects.toThrow('identity changed');
  });
  expect(authenticated.history.post).toHaveLength(0);
  expect(client.getQueryData(getQueryKeys('other').LEARNING_PATH_DETAIL(path))).toBeUndefined();
});
