import 'core-js/stable';
import 'regenerator-runtime/runtime';

import {
  APP_INIT_ERROR, APP_READY, subscribe, initialize, mergeConfig,
} from '@edx/frontend-platform';
import { AppProvider, ErrorPage } from '@edx/frontend-platform/react';
import ReactDOM from 'react-dom/client';
import { Routes, Route } from 'react-router-dom';
import { QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';

import { LearningHeader as Header } from '@edx/frontend-component-header';
import FooterSlot from '@openedx/frontend-slot-footer';
import messages from './i18n';
import queryClient from './queryClient';
import Dashboard from './learningpath/Dashboard';
import LearningPathDetailPage from './learningpath/LearningPathDetails';
import CourseDetailPage from './learningpath/CourseDetails';

import './index.scss';

subscribe(APP_READY, () => {
  const root = ReactDOM.createRoot(document.getElementById('root'));
  root.render(
    <AppProvider store={null}>
      <QueryClientProvider client={queryClient}>
        <Header />
        <main id="main-content">
          <Routes>
            <Route
              path="/"
              element={<Dashboard />}
            />
            <Route
              path="/learningpath/:key/*"
              element={<LearningPathDetailPage />}
            />
            <Route
              path="/course/:courseKey"
              element={<CourseDetailPage />}
            />
          </Routes>
        </main>
        <FooterSlot />
        {process.env.NODE_ENV === 'development' && <ReactQueryDevtools />}
      </QueryClientProvider>
    </AppProvider>,
  );
});

subscribe(APP_INIT_ERROR, (error) => {
  const root = ReactDOM.createRoot(document.getElementById('root'));
  root.render(<ErrorPage message={error.message} />);
});

initialize({
  messages,
  requireAuthenticatedUser: true,
  handlers: {
    config: () => {
      mergeConfig({
        DASHBOARD_PAGE_SIZE: process.env.DASHBOARD_PAGE_SIZE || null,
      }, 'LearningPathsConfig');
    },
  },
});
