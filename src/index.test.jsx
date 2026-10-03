import { waitFor } from '@testing-library/react';

// Execute the real frontend-platform initialization pipeline. Only its services and
// the DOM render boundary are isolated; the application's auth flags are untouched.
jest.mock('@edx/frontend-platform', () => {
  const actual = jest.requireActual('@edx/frontend-platform');
  const { MockAuthService } = jest.requireActual('@edx/frontend-platform/auth');
  const { MockLoggingService } = jest.requireActual('@edx/frontend-platform/logging');
  const { MockAnalyticsService } = jest.requireActual('@edx/frontend-platform/analytics');
  return {
    ...actual,
    initialize: jest.fn(options => actual.initialize({
      ...options,
      authService: MockAuthService,
      loggingService: MockLoggingService,
      analyticsService: MockAnalyticsService,
      externalScripts: [],
      handlers: {
        ...options.handlers,
        config: () => {
          options.handlers.config();
          actual.mergeConfig({ authenticatedUser: global.bootstrapUser });
        },
      },
    })),
  };
});

jest.mock('react-dom/client', () => ({
  createRoot: jest.fn(() => ({ render: jest.fn() })),
}));

test.each([null, {
  userId: '7', username: 'learner', roles: [], administrator: false,
}])(
  'native startup reaches APP_READY without forced login and retains hydrated identity: %s',
  async user => {
    jest.resetModules();
    global.bootstrapUser = user;
    document.body.innerHTML = '<div id="root"></div>';
    await import('./index');
    const platform = await import('@edx/frontend-platform');
    const { getAuthService } = await import('@edx/frontend-platform/auth');
    const { default: ReactDOM } = await import('react-dom/client');
    await platform.initialize.mock.results[0].value;
    await waitFor(() => expect(ReactDOM.createRoot).toHaveBeenCalledTimes(1));
    const service = getAuthService();
    expect(service.fetchAuthenticatedUser).toHaveBeenCalledTimes(1);
    expect(service.ensureAuthenticatedUser).not.toHaveBeenCalled();
    expect(service.redirectToLogin).not.toHaveBeenCalled();
    expect(service.getAuthenticatedUser()).toEqual(user);
    expect(service.hydrateAuthenticatedUser).toHaveBeenCalledTimes(user ? 1 : 0);
    expect(ReactDOM.createRoot.mock.results[0].value.render).toHaveBeenCalledTimes(1);
    delete global.bootstrapUser;
  },
  60000,
);
