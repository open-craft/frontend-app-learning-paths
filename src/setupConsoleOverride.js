// Suppress warnings in test and development environments.
/* eslint-disable no-console */

if (process.env.NODE_ENV === 'test' || process.env.NODE_ENV === 'development') {
  const originalConsoleError = console.error;
  console.error = (...args) => {
    if (
      typeof args[0] === 'string'
      && args[0].includes('Support for defaultProps will be removed from function components in a future major release.')
      && typeof args[2] === 'string'
      && (args[2].includes('/@openedx/paragon') || args[2].includes('react-bootstrap') || args[2].includes('react-router'))
    ) {
      return;
    }

    if (typeof args[1] === 'string' && (args[1].includes('SiteFooter') || args[1].includes('LearningHeader'))) {
      return;
    }

    if (typeof args[3] === 'string' && args[3].includes('LearningHeader')) {
      return;
    }

    originalConsoleError(...args);
  };
}
