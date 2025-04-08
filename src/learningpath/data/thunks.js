import * as api from './api';
import {
  fetchLearningPathsRequest,
  fetchLearningPathsSuccess,
  fetchLearningPathsFailure,
  fetchCoursesRequest,
  fetchCoursesSuccess,
  fetchCoursesFailure,
  fetchCompletionsRequest,
  fetchCompletionsSuccess,
  fetchCompletionsFailure,
} from './slice';

const shouldFetchCompletions = (state) => {
  const { fetching, completions, errors } = state.completions;
  return !fetching && (Object.keys(completions).length === 0 || errors.length > 0);
};

export const fetchCompletions = () => async (dispatch, getState) => {
  if (!shouldFetchCompletions(getState())) {
    const { completions: { completions } } = getState();
    return Promise.resolve(completions);
  }

  try {
    dispatch(fetchCompletionsRequest());
    const completions = await api.fetchAllCourseCompletions();
    dispatch(fetchCompletionsSuccess({ completions }));
    return completions;
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Failed to fetch course completions:', error);
    dispatch(fetchCompletionsFailure({ errors: [String(error)] }));
    return [];
  }
};

export const fetchLearningPaths = () => async (dispatch) => {
  try {
    dispatch(fetchLearningPathsRequest());
    await dispatch(fetchCompletions());
    const type = 'learning_path';
    const learningPathList = await api.fetchLearningPaths();
    const learningPaths = await Promise.all(
      learningPathList.map(async (lp) => {
        const lpProgress = await api.fetchLearningPathProgress(lp.key);
        let status = 'In Progress';
        if (lpProgress.progress === 0.0) {
          status = 'Not started';
        } else if (lpProgress.progress >= lpProgress.requiredCompletion) {
          status = 'Completed';
        }
        let percent = 0;
        if (lpProgress.requiredCompletion) {
          percent = lpProgress.requiredCompletion > 0
            ? Math.round((lpProgress.progress / lpProgress.requiredCompletion) * 100)
            : 0;
        } else {
          percent = lpProgress.percent;
        }
        let maxDate = null;
        const numCourses = lp.steps.length;
        for (const course of lp.steps) {
          if (course.dueDate) {
            const dueDateObj = new Date(course.dueDate);
            if (!maxDate || dueDateObj > maxDate) {
              maxDate = dueDateObj;
            }
          }
        }
        // Convert maxDate to an ISO string for serialization
        if (maxDate) {
          maxDate = maxDate.toISOString();
        }
        return {
          ...lp,
          numCourses,
          status,
          maxDate,
          percent,
          type,
        };
      }),
    );
    dispatch(fetchLearningPathsSuccess({ learningPaths }));
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Failed to fetch learning paths:', error);
    dispatch(fetchLearningPathsFailure({ errors: [String(error)] }));
  }
};

export const fetchCourses = () => async (dispatch, getState) => {
  try {
    dispatch(fetchCoursesRequest());
    await dispatch(fetchCompletions());
    const type = 'course';
    const courses = await api.fetchAllCourseDetails();
    const { completions } = getState().completions;

    const coursesWithStatus = courses.map(course => {
      const courseKey = `course-v1:${course.org}+${course.courseId}+${course.run}`;
      const completion = completions[courseKey]?.percent || 0;

      let status = 'In progress';
      if (completion <= 0.0) {
        status = 'Not started';
      } else if (completion >= 1.0) {
        status = 'Completed';
      }

      return {
        ...course,
        status,
        percent: completion,
        type,
      };
    });

    dispatch(fetchCoursesSuccess({ courses: coursesWithStatus }));
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Failed to fetch courses:', error);
    dispatch(fetchCoursesFailure({ errors: [String(error)] }));
  }
};
