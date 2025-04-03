import * as api from './api';
import {
  fetchLearningPathwaysRequest,
  fetchLearningPathwaysSuccess,
  fetchLearningPathwaysFailure,
  fetchCoursesRequest,
  fetchCoursesSuccess,
  fetchCoursesFailure,
} from './slice';

export const fetchLearningPathways = () => async (dispatch) => {
  try {
    dispatch(fetchLearningPathwaysRequest());
    const type = 'learning_path';
    const pathwaylist = await api.fetchLearningPaths();
    const pathways = await Promise.all(
      pathwaylist.map(async (lp) => {
        const lpdetail = await api.fetchLearningPathDetail(lp.key);
        const lpprogress = await api.fetchLearningPathProgress(lp.key);
        let status = 'In Progress';
        if (lpprogress.progress === 0.0) {
          status = 'Not started';
        } else if (lpprogress.progress >= lpprogress.requiredCompletion) {
          status = 'Completed';
        }
        let percent = 0;
        if (lpprogress.requiredCompletion) {
          percent = lpprogress.requiredCompletion > 0
            ? Math.round((lpprogress.progress / lpprogress.requiredCompletion) * 100)
            : 0;
        } else {
          percent = lpprogress.percent;
        }
        let maxDate = null;
        const numCourses = lpdetail.steps.length;
        for (const course of lpdetail.steps) {
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
          ...lpdetail,
          numCourses,
          status,
          maxDate,
          percent,
          type,
        };
      }),
    );
    dispatch(fetchLearningPathwaysSuccess({ pathways }));
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Failed to fetch learning paths:', error);
    dispatch(fetchLearningPathwaysFailure({ errors: [String(error)] }));
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
