import 'core-js/stable';
import 'regenerator-runtime/runtime';

import {
  APP_INIT_ERROR, APP_READY, subscribe, initialize,
} from '@edx/frontend-platform';
import { AppProvider, ErrorPage } from '@edx/frontend-platform/react';
import ReactDOM from 'react-dom';
import { Routes, Route } from 'react-router-dom';

import Header from '@edx/frontend-component-header';
import FooterSlot from '@openedx/frontend-slot-footer';
import messages from './i18n';
import store from './store';
import LearningPathList from './learningpath/LearningPathList';
import LearningPathDetailPage from './learningpath/LearningPathDetails';
import CourseDetailPage from './learningpath/CourseDetails';

import './index.scss';

subscribe(APP_READY, () => {
  ReactDOM.render(
    <AppProvider store={store}>
      <Header />
      <Routes>
        <Route 
          path="/" 
          element={<LearningPathList />} 
        />
        <Route 
          path="/learningpath/:uuid/*"
          element={<LearningPathDetailPage />} 
        />
        <Route
          path="/course/:courseKey"
          element={<CourseDetailPage />}
        />
      </Routes>
      <FooterSlot />
    </AppProvider>,
    document.getElementById('root'),
  );
});

subscribe(APP_INIT_ERROR, (error) => {
  ReactDOM.render(<ErrorPage message={error.message} />, document.getElementById('root'));
});

initialize({
  messages,
});
