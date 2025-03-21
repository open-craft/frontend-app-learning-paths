import { createSlice } from '@reduxjs/toolkit';

const initialLearningPathState = () => ({
  fetching: false,
  learningPathways: [],
  errors: [],
  detailFetching: false,
  detailError: null,
  detailItem: null,
});

const initialCoursesState = () => ({
  fetching: false,
  courses: [],
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

const learningPathSlice = createSlice({
  name: 'learningPath',
  initialState: initialLearningPathState(),
  reducers: {
    fetchLearningPathwaysRequest(state) {
      state.fetching = true;
      state.errors = [];
      state.learningPathways = [];
    },
    fetchLearningPathwaysSuccess(state, action) {
      state.fetching = false;
      state.learningPathways = action.payload.pathways;
    },
    fetchLearningPathwaysFailure(state, action) {
      state.fetching = false;
      state.errors = action.payload.errors;
    },
  },
});

export const { 
  fetchLearningPathwaysRequest, 
  fetchLearningPathwaysSuccess, 
  fetchLearningPathwaysFailure, 
} = learningPathSlice.actions;

export const {
  fetchCoursesRequest,
  fetchCoursesSuccess,
  fetchCoursesFailure,
} = coursesSlice.actions;

export const learningPathReducer = learningPathSlice.reducer;
export const coursesReducer = coursesSlice.reducer;
