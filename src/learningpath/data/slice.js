/* eslint-disable no-param-reassign */
import { createSlice } from '@reduxjs/toolkit';

const initialLearningPathState = () => ({
  fetching: false,
  learningPaths: [],
  errors: [],
});

const initialCoursesState = () => ({
  fetching: false,
  courses: [],
  errors: [],
});

const initialCompletionsState = () => ({
  fetching: false,
  completions: {},
  errors: [],
});

const coursesSlice = createSlice({
  name: 'courses',
  initialState: initialCoursesState(),
  reducers: {
    fetchCoursesRequest(state) {
      state.fetching = true;
      state.errors = [];
      state.courses = [];
    },
    fetchCoursesSuccess(state, action) {
      state.fetching = false;
      state.courses = action.payload.courses;
    },
    fetchCoursesFailure(state, action) {
      state.fetching = false;
      state.errors = action.payload.errors;
    },
  },
});

const completionsSlice = createSlice({
  name: 'completions',
  initialState: initialCompletionsState(),
  reducers: {
    fetchCompletionsRequest(state) {
      state.fetching = true;
      state.errors = [];
    },
    fetchCompletionsSuccess(state, action) {
      state.fetching = false;
      const completionsMap = {};
      action.payload.completions.forEach(completion => {
        completionsMap[completion.courseKey] = completion.completion;
      });
      state.completions = completionsMap;
    },
    fetchCompletionsFailure(state, action) {
      state.fetching = false;
      state.errors = action.payload.errors;
    },
  },
});

const learningPathSlice = createSlice({
  name: 'learningPath',
  initialState: initialLearningPathState(),
  reducers: {
    fetchLearningPathsRequest(state) {
      state.fetching = true;
      state.errors = [];
      state.learningPaths = [];
    },
    fetchLearningPathsSuccess(state, action) {
      state.fetching = false;
      state.learningPaths = action.payload.learningPaths;
    },
    fetchLearningPathsFailure(state, action) {
      state.fetching = false;
      state.errors = action.payload.errors;
    },
  },
});

export const {
  fetchLearningPathsRequest,
  fetchLearningPathsSuccess,
  fetchLearningPathsFailure,
} = learningPathSlice.actions;

export const {
  fetchCoursesRequest,
  fetchCoursesSuccess,
  fetchCoursesFailure,
} = coursesSlice.actions;

export const {
  fetchCompletionsRequest,
  fetchCompletionsSuccess,
  fetchCompletionsFailure,
} = completionsSlice.actions;

export const learningPathReducer = learningPathSlice.reducer;
export const coursesReducer = coursesSlice.reducer;
export const completionsReducer = completionsSlice.reducer;
