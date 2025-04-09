import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useCallback } from 'react';
import * as api from './api';

// Query keys
export const QUERY_KEYS = {
  ALL_LEARNING_PATHS: ['learningPaths'],
  LEARNING_PATH_DETAIL: (key) => ['learningPath', key],
  LEARNING_PATH_PROGRESS: (key) => ['learningPathProgress', key],
  ALL_COURSES: ['courses'],
  COURSE_DETAILS: (courseId) => ['course', courseId],
  COURSE_COMPLETIONS: ['courseCompletions'],
  COURSE_COMPLETION: (courseId) => ['courseCompletion', courseId],
};

// Stale time configurations
export const STALE_TIMES = {
  LEARNING_PATHS: 5 * 60 * 1000, // 5 minutes
  LEARNING_PATH_DETAIL: 5 * 60 * 1000, // 5 minutes

  COURSES: 5 * 60 * 1000, // 5 minutes
  COURSE_DETAIL: 5 * 60 * 1000, // 5 minutes

  COMPLETIONS: 60 * 1000, // 1 minute
};

// Learning Paths Queries
export const useLearningPaths = () => useQuery({
  queryKey: QUERY_KEYS.ALL_LEARNING_PATHS,
  queryFn: async () => {
    const learningPathList = await api.fetchLearningPaths();

    const processedPaths = await Promise.all(
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
        const isoMaxDate = maxDate ? maxDate.toISOString() : null;

        return {
          ...lp,
          numCourses,
          status,
          maxDate: isoMaxDate,
          percent,
          type: 'learning_path',
        };
      }),
    );

    return processedPaths;
  },
});

export const useLearningPathDetail = (key) => useQuery({
  queryKey: QUERY_KEYS.LEARNING_PATH_DETAIL(key),
  queryFn: () => api.fetchLearningPathDetail(key),
  enabled: !!key,
});

// Hook for prefetching learning path details and all related data
export const usePrefetchLearningPathDetail = () => {
  const queryClient = useQueryClient();

  return (key) => {
    if (!key) {
      return;
    }

    queryClient.fetchQuery({
      queryKey: QUERY_KEYS.LEARNING_PATH_DETAIL(key),
      queryFn: () => api.fetchLearningPathDetail(key),
      staleTime: STALE_TIMES.LEARNING_PATH_DETAIL,
    })
      .then(learningPathData => {
        if (!learningPathData?.steps || learningPathData.steps.length === 0) {
          return;
        }

        const courseIds = learningPathData.steps.map(step => step.courseKey);

        queryClient.fetchQuery({
          queryKey: QUERY_KEYS.COURSE_COMPLETIONS,
          queryFn: api.fetchAllCourseCompletions,
          staleTime: STALE_TIMES.COMPLETIONS,
        })
          .then(completionsData => {
            const completionsMap = {};
            completionsData?.forEach?.(item => {
              completionsMap[item.courseKey] = item.completion;
            });

            queryClient.fetchQuery({
              queryKey: QUERY_KEYS.ALL_COURSES,
              queryFn: () => api.fetchCourses(),
              staleTime: STALE_TIMES.COURSES,
            });

            courseIds.forEach(courseId => {
              queryClient.fetchQuery({
                queryKey: QUERY_KEYS.COURSE_DETAILS(courseId),
                queryFn: () => api.fetchCourseDetails(courseId),
                staleTime: STALE_TIMES.COURSE_DETAIL,
              });
            });

            // Fetch the combined course data.
            queryClient.fetchQuery({
              queryKey: ['coursesByIds', ...courseIds],
              queryFn: () => api.fetchCoursesByIds(courseIds, completionsMap),
              staleTime: STALE_TIMES.COURSE_DETAIL,
            });
          })
          .catch(error => {
            // eslint-disable-next-line no-console
            console.error('Error prefetching course completions:', error);
          });
      })
      .catch(error => {
        // eslint-disable-next-line no-console
        console.error('Error prefetching learning path:', error);
      });
  };
};

// Course Queries
export const useCourses = () => {
  const queryClient = useQueryClient();

  return useQuery({
    queryKey: QUERY_KEYS.ALL_COURSES,
    queryFn: async () => {
      await queryClient.prefetchQuery({
        queryKey: QUERY_KEYS.COURSE_COMPLETIONS,
        queryFn: api.fetchAllCourseCompletions,
      });

      const completions = queryClient.getQueryData(QUERY_KEYS.COURSE_COMPLETIONS) || {};
      const completionsMap = {};

      completions.forEach?.(item => {
        completionsMap[item.courseKey] = item.completion;
      });

      const courses = await api.fetchAllCourseDetails();

      return courses.map(course => {
        const courseKey = `course-v1:${course.org}+${course.courseId}+${course.run}`;
        const completion = completionsMap[courseKey]?.percent || 0;

        let status = 'In progress';
        if (completion === 0.0) {
          status = 'Not started';
        } else if (completion === 1.0) {
          status = 'Completed';
        }

        return {
          ...course,
          status,
          percent: completion,
          type: 'course',
        };
      });
    },
  });
};

export const useCourseCompletions = () => useQuery({
  queryKey: QUERY_KEYS.COURSE_COMPLETIONS,
  queryFn: api.fetchAllCourseCompletions,
  staleTime: STALE_TIMES.COMPLETIONS,
});

export const useCoursesByIds = (courseIds) => {
  const queryClient = useQueryClient();

  return useQuery({
    queryKey: ['coursesByIds', ...(courseIds || [])],
    queryFn: async () => {
      let completionsData = queryClient.getQueryData(QUERY_KEYS.COURSE_COMPLETIONS);
      if (!completionsData) {
        completionsData = await queryClient.fetchQuery({
          queryKey: QUERY_KEYS.COURSE_COMPLETIONS,
          queryFn: api.fetchAllCourseCompletions,
        });
      }

      const completionsMap = {};
      completionsData?.forEach?.(item => {
        completionsMap[item.courseKey] = item.completion;
      });

      const results = await Promise.all(
        courseIds.map(async (courseId) => {
          const courseIdParts = courseId.split(':')[1]?.split('+');
          const simpleId = courseIdParts?.[1];

          const cachedCourseDetail = simpleId
            ? queryClient.getQueryData(['courseDetail', simpleId]) : null;
          if (cachedCourseDetail) {
            const completion = completionsMap[courseId]?.percent || 0;

            let status = 'In progress';
            if (completion <= 0.0) {
              status = 'Not started';
            } else if (completion >= 1.0) {
              status = 'Completed';
            }

            const basicCoursesData = queryClient.getQueryData(['basicCoursesData']) || [];
            const basicData = basicCoursesData.find(c => c.courseId === simpleId) || {};

            return {
              ...basicData,
              ...cachedCourseDetail,
              status,
              percent: completion,
            };
          }

          return api.fetchCoursesByIds([courseId], completionsMap).then(data => data[0]);
        }),
      );

      return results;
    },
    enabled: courseIds && courseIds.length > 0,
  });
};

export const useCourseDetail = (courseKey) => {
  const queryClient = useQueryClient();

  return useQuery({
    queryKey: QUERY_KEYS.COURSE_DETAILS(courseKey),
    queryFn: async () => {
      await queryClient.prefetchQuery({
        queryKey: QUERY_KEYS.COURSE_COMPLETIONS,
        queryFn: api.fetchAllCourseCompletions,
      });

      const completions = queryClient.getQueryData(QUERY_KEYS.COURSE_COMPLETIONS) || {};
      const completionsMap = {};

      completions.forEach?.(item => {
        completionsMap[item.courseKey] = item.completion;
      });

      const courses = await api.fetchCoursesByIds([courseKey], completionsMap);
      return courses && courses.length > 0 ? courses[0] : null;
    },
    enabled: !!courseKey,
  });
};

// Hook to prefetch course details when hovering
export const usePrefetchCourseDetail = (courseId) => {
  const queryClient = useQueryClient();

  const prefetchCourse = useCallback(() => {
    if (courseId) {
      try {
        queryClient.fetchQuery({
          queryKey: QUERY_KEYS.COURSE_DETAILS(courseId),
          queryFn: () => api.fetchCourseDetails(courseId),
          staleTime: STALE_TIMES.COURSE_DETAIL,
        });

        queryClient.fetchQuery({
          queryKey: QUERY_KEYS.COURSE_COMPLETION(courseId),
          queryFn: () => api.fetchCourseCompletion(courseId),
          staleTime: STALE_TIMES.COMPLETIONS,
        });
      } catch (error) {
        // eslint-disable-next-line no-console
        console.error('Error prefetching course data:', error);
      }
    }
  }, [courseId, queryClient]);

  return prefetchCourse;
};
