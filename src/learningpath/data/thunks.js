import * as api from './api';
import {
  fetchLearningPathsRequest,
  fetchLearningPathsSuccess,
  fetchLearningPathsFailure,
  fetchCoursesRequest,
  fetchCoursesSuccess,
  fetchCoursesFailure,
} from './slice';

export const fetchLearningPaths = () => async (dispatch) => {
  try {
    dispatch(fetchLearningPathsRequest());
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

export const fetchCourses = () => async (dispatch) => {
  try {
    dispatch(fetchCoursesRequest());
    const type = 'course';
    const courses = await api.fetchAllCourseDetails();
    const coursesWithStatus = await Promise.all(
      courses.map(async (course) => {
        const courseKey = `course-v1:${course.org}+${course.courseId}+${course.run}`;
        const percent = await api.fetchCourseCompletion(courseKey);
        let status = 'In progress';
        if (percent === 0.0) {
          status = 'Not started';
        } else if (percent === 100.0) {
          status = 'Completed';
        }
        return {
          ...course,
          status,
          percent,
          type,
        };
      }),
    );
    dispatch(fetchCoursesSuccess({ courses: coursesWithStatus }));
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Failed to fetch courses:', error);
    dispatch(fetchCoursesFailure({ errors: [String(error)] }));
  }
};
