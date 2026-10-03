import MockAdapter from 'axios-mock-adapter';
import { mergeConfig } from '@edx/frontend-platform';
import { initializeMockApp } from '@edx/frontend-platform/testing';
import { QueryClient } from '@tanstack/react-query';
import { getQueryKeys } from './queries';

const base = 'https://lms.example.test';
const original = {
  userId: '7', username: 'first', roles: [], administrator: false,
};
const replacement = { ...original, userId: '8', username: 'second' };
const endpoints = [
  {
    name: 'organizations',
    operation: 'fetchOrganizations',
    key: 'ORGANIZATIONS',
    url: `${base}/api/organizations/v0/organizations/?page_size=100`,
    body: (results, next) => ({ results, next }),
    first: { short_name: 'first-only' },
    second: { short_name: 'first-page2' },
    normalized: [{ shortName: 'first-only' }, { shortName: 'first-page2' }],
  },
  {
    name: 'completions',
    operation: 'fetchAllCourseCompletions',
    key: 'COURSE_COMPLETIONS',
    url: `${base}/completion-aggregator/v1/course/?username=first&page_size=10000&include_optional=true`,
    body: (results, next) => ({ results, pagination: { next } }),
    first: { course_key: 'first-only', completion: 0.1, optional_completion: 0 },
    second: { course_key: 'first-page2', completion: 0.2, optional_completion: 0 },
    normalized: [
      { courseKey: 'first-only', completion: 0.1, optionalCompletion: 0 },
      { courseKey: 'first-page2', completion: 0.2, optionalCompletion: 0 },
    ],
  },
];

describe.each(endpoints)('Native $name pagination ownership', (endpoint) => {
  let service;
  let transport;
  let cache;
  let keys;
  const nextUrl = `${base}/private-page2`;
  const request = () => cache.fetchQuery({ queryKey: keys[endpoint.key], queryFn: keys.API[endpoint.operation] });

  beforeEach(() => {
    mergeConfig({ LMS_BASE_URL: base });
    ({ authService: service } = initializeMockApp());
    service.setAuthenticatedUser({ ...original });
    transport = new MockAdapter(service.getAuthenticatedHttpClient());
    cache = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    keys = getQueryKeys(original.username);
  });

  afterEach(() => { cache.clear(); transport.restore(); });

  test('unchanged principal reads both pages through the native query/cache', async () => {
    transport.onGet(endpoint.url).reply(200, endpoint.body([endpoint.first], nextUrl));
    transport.onGet(nextUrl).reply(200, endpoint.body([endpoint.second], null));
    expect(await request()).toEqual(endpoint.normalized);
    expect(transport.history.get).toHaveLength(2);
    expect(cache.getQueryData(keys[endpoint.key])).toEqual(endpoint.normalized);
  });

  test.each([
    ['logout', null],
    ['different username', replacement],
    ['different userId with the same username', { ...replacement, username: original.username }],
  ])('refuses the next HTTP effect after %s and stores no mixed/partial result', async (_, actor) => {
    transport.onGet(endpoint.url).reply(() => {
      service.setAuthenticatedUser(actor);
      return [200, endpoint.body([endpoint.first], nextUrl)];
    });
    transport.onGet(nextUrl).reply(200, endpoint.body([endpoint.second], null));
    await expect(request()).rejects.toThrow(/identity changed/);
    expect(transport.history.get).toHaveLength(1);
    expect(cache.getQueryData(keys[endpoint.key])).toBeUndefined();
  });

  test('a final response issued under the original principal stays in its original query key', async () => {
    transport.onGet(endpoint.url).reply(() => {
      service.setAuthenticatedUser(replacement);
      return [200, endpoint.body([endpoint.first], null)];
    });
    expect(await request()).toEqual(endpoint.normalized.slice(0, 1));
    expect(transport.history.get).toHaveLength(1);
    expect(cache.getQueryData(keys[endpoint.key])).toEqual(endpoint.normalized.slice(0, 1));
    expect(cache.getQueryData(getQueryKeys(replacement.username)[endpoint.key])).toBeUndefined();
  });

  test('a mutable native user object cannot redefine the starting principal', async () => {
    transport.onGet(endpoint.url).reply(() => {
      const current = service.getAuthenticatedUser();
      current.username = replacement.username;
      current.userId = replacement.userId;
      return [200, endpoint.body([endpoint.first], nextUrl)];
    });
    transport.onGet(nextUrl).reply(200, endpoint.body([endpoint.second], null));
    await expect(request()).rejects.toThrow(/identity changed/);
    expect(transport.history.get).toHaveLength(1);
    expect(cache.getQueryData(keys[endpoint.key])).toBeUndefined();
  });

  test('a late final second page stays with the principal that issued both reads', async () => {
    transport.onGet(endpoint.url).reply(200, endpoint.body([endpoint.first], nextUrl));
    transport.onGet(nextUrl).reply(() => {
      service.setAuthenticatedUser(replacement);
      return [200, endpoint.body([endpoint.second], null)];
    });
    expect(await request()).toEqual(endpoint.normalized);
    expect(transport.history.get).toHaveLength(2);
    expect(cache.getQueryData(keys[endpoint.key])).toEqual(endpoint.normalized);
    expect(cache.getQueryData(getQueryKeys(replacement.username)[endpoint.key])).toBeUndefined();
  });

  test('an ordinary rejected page does not publish partial success and can retry', async () => {
    transport.onGet(endpoint.url).reply(200, endpoint.body([endpoint.first], nextUrl));
    transport.onGet(nextUrl).replyOnce(503);
    await expect(request()).rejects.toMatchObject({ response: { status: 503 } });
    expect(cache.getQueryData(keys[endpoint.key])).toBeUndefined();
    transport.onGet(nextUrl).reply(200, endpoint.body([endpoint.second], null));
    expect(await request()).toEqual(endpoint.normalized);
    expect(transport.history.get).toHaveLength(4);
  });
});
