import { configureStore } from '@reduxjs/toolkit';
import { learningPathReducer, coursesReducer } from './learningpath/data/slice';

const store = configureStore({
  reducer: {
    learningPath: learningPathReducer,
    courses: coursesReducer,
  },
});

export default store;
