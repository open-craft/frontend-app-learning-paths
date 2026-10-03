import React from 'react';
import {
  fireEvent, render, screen, waitFor,
} from '@testing-library/react';
import { IntlProvider } from '@edx/frontend-platform/i18n';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AppContext } from '@edx/frontend-platform/react';
import { mergeConfig } from '@edx/frontend-platform';
import { initializeMockApp } from '@edx/frontend-platform/testing';
import MockAdapter from 'axios-mock-adapter';
import LearningPathCard from './LearningPathCard';
import LearningPathDetails from './LearningPathDetails';
import { CourseCardWithEnrollment } from './CourseCard';

const path = 'path-v1:ORG+Path+2026';
const course = {
  id: 'course-v1:ORG+Course+2026', courseImageAssetPath: '/image', name: 'Public course', org: 'ORG', percent: 0, status: 'Not started',
};
const base = 'https://lms.example.test';
let client;
let service;
let browse;
let authenticated;
const anonymousContext = { authenticatedUser: null };

beforeEach(() => {
  window.scrollTo = jest.fn();
  mergeConfig({ LMS_BASE_URL: base, LEARNING_BASE_URL: 'https://apps.example.test/learning' });
  ({ authService: service } = initializeMockApp());
  client = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } });
  browse = new MockAdapter(service.getHttpClient());
  authenticated = new MockAdapter(service.getAuthenticatedHttpClient());
});

afterEach(() => { client.clear(); browse.restore(); authenticated.restore(); });

function renderPage(element, route = '/') {
  return render(
    <IntlProvider locale="en" messages={{}}>
      <AppContext.Provider value={anonymousContext}>
        <QueryClientProvider client={client}>
          <MemoryRouter initialEntries={[route]}>
            {element}
          </MemoryRouter>
        </QueryClientProvider>
      </AppContext.Provider>
    </IntlProvider>,
  );
}

test('a public card encodes the path route segment rather than treating key punctuation as URL syntax', () => {
  renderPage(<LearningPathCard learningPath={{
    key: `${path}/branch?tab=bad#fragment`,
    displayName: 'Public path',
    org: 'ORG',
    status: 'Not started',
    percent: 0,
    numCourses: 1,
  }}
  />);
  expect(screen.getByRole('link').getAttribute('href'))
    .toBe(`/learningpath/${encodeURIComponent(`${path}/branch?tab=bad#fragment`)}`);
});

test('the native course card renders for a visitor; Start returns to login without an enrollment request', async () => {
  renderPage(<CourseCardWithEnrollment
    course={course}
    learningPathId={path}
    isEnrolledInLearningPath={false}
    onClick={() => {}}
  />);
  const start = screen.getByRole('button', { name: 'Start' });
  expect(start.disabled).toBe(false);
  fireEvent.click(start);
  await waitFor(() => expect(service.redirectToLogin).toHaveBeenCalledWith(window.location.href));
  expect(authenticated.history.get).toHaveLength(0);
  expect(authenticated.history.post).toHaveLength(0);
});

test('the actual detail route loads anonymously and Enroll keeps the About tab without a success illusion', async () => {
  browse.onGet(`${base}/api/learning_paths/v1/learning-paths/${encodeURIComponent(path)}/`).reply(200, {
    key: path, display_name: 'Public path', steps: [], description: 'Public description',
  });
  const element = (
    <Routes>
      <Route path="/learningpath/:key/*" element={<LearningPathDetails />} />
    </Routes>
  );
  renderPage(element, `/learningpath/${encodeURIComponent(path)}`);
  await screen.findByRole('heading', { name: 'Public path' });
  fireEvent.click(screen.getByRole('button', { name: 'Enroll' }));
  await waitFor(() => expect(service.redirectToLogin).toHaveBeenCalledWith(window.location.href));
  expect(screen.getByRole('heading', { name: 'About' })).toBeTruthy();
  expect(screen.queryByRole('button', { name: 'Enrolled' })).toBeNull();
  expect(authenticated.history.get).toHaveLength(0);
  expect(authenticated.history.post).toHaveLength(0);
});
