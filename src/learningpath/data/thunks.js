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
    const pathwaylist = await api.fetchLearningPaths();
    const pathways = await Promise.all(
      pathwaylist.map(async (lp) => {
        const lpdetail = await api.fetchLearningPathDetail(lp.uuid);
        const lpprogress = await api.fetchLearningPathProgress(lp.uuid);
        let status = "In Progress";
        if (lpprogress.progress == 0.0){
          status = "Not started";
        } else if (lpprogress.progress >= lpprogress.required_completion) {
          status = "Completed";
        }
        return {
          ...lp,
          ...lpdetail,
          status,
        };
      })
    );
    dispatch(fetchLearningPathwaysSuccess({ pathways }));
  } catch (error) {
    console.error('Failed to fetch learning pathways:', error);
    dispatch(fetchLearningPathwaysFailure({ errors: [String(error)] }));
  }
};

export const fetchCourses = () => async (dispatch) => {
  try {
    dispatch(fetchCoursesRequest());
    const courses = await api.fetchAllCourseDetails();
    const coursesWithStatus = await Promise.all(
      courses.map(async (course) => {
        const course_key = "course-v1:"+ course.org + "+" + course.course_id + "+" + course.run
        const percent = await api.fetchCourseCompletion(course_key);
        let status = 'In progress';
        if (percent === 0.0) {
          status = 'Not started';
        } else if (percent === 100.0) {
          status = 'Completed';
        }
        return {
          ...course,
          status,
        };
      })
    );
    dispatch(fetchCoursesSuccess({ courses: coursesWithStatus }));
  } catch (error) {
    console.error('Failed to fetch courses:', error);
    dispatch(fetchCoursesFailure({ errors: [String(error)] }));
  }
};

