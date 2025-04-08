import { configureStore } from '@reduxjs/toolkit';
import { learningPathReducer, coursesReducer, completionsReducer } from './learningpath/data/slice';

const store = configureStore({
  reducer: {
    learningPath: learningPathReducer,
    courses: coursesReducer,
    completions: completionsReducer,
  },
});

export default store;
