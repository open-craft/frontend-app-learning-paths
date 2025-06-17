import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query';
import { useCallback } from 'react';
import * as api from './api';
import {
  addCompletionStatus,
  addLearningPathNames,
  createCompletionsMap,
  createCourseToLearningPathsMap,
} from './dataUtils';

// Query keys
export const QUERY_KEYS = {
  ALL_LEARNING_PATHS: ['learningPaths'],
  LEARNING_PATH_DETAIL: (key) => ['learningPath', key],
  LEARNING_PATH_PROGRESS: (key) => ['learningPathProgress', key],
  ALL_COURSES: ['courses'],
  COURSE_DETAILS: (courseId) => ['course', courseId],
  COURSE_COMPLETIONS: ['courseCompletions'],
  COURSE_COMPLETION: (courseId) => ['courseCompletion', courseId],
  COURSE_ENROLLMENT_STATUS: (courseId) => ['courseEnrollmentStatus', courseId],
  ORGANIZATIONS: ['organizations'],
};

// Stale time configurations
export const STALE_TIMES = {
  LEARNING_PATHS: 5 * 60 * 1000, // 5 minutes
  LEARNING_PATH_DETAIL: 5 * 60 * 1000, // 5 minutes

  COURSES: 5 * 60 * 1000, // 5 minutes
  COURSE_DETAIL: 5 * 60 * 1000, // 5 minutes
  COURSE_ENROLLMENTS: 60 * 1000, // 1 minute

  COMPLETIONS: 60 * 1000, // 1 minute

  ORGANIZATIONS: 60 * 60 * 1000, // 1 hour
};

// Learning Paths Queries
export const useLearningPaths = () => {
  const queryClient = useQueryClient();

  return useQuery({
    queryKey: QUERY_KEYS.ALL_LEARNING_PATHS,
    queryFn: async () => {
      await queryClient.prefetchQuery({
        queryKey: QUERY_KEYS.COURSE_COMPLETIONS,
        queryFn: api.fetchAllCourseCompletions,
      });

      const completions = queryClient.getQueryData(QUERY_KEYS.COURSE_COMPLETIONS) || {};
      const completionsMap = createCompletionsMap(completions);

      const learningPathList = await api.fetchLearningPaths();

      return learningPathList.map(lp => {
        // Calculate progress based on course completions
        const totalCourses = lp.steps.length;

        if (totalCourses === 0) {
          return {
            ...lp,
            numCourses: 0,
            status: 'Not started',
            maxDate: null,
            percent: 0,
            type: 'learning_path',
          };
        }

        const totalCompletion = lp.steps.reduce((sum, step) => {
          const completion = completionsMap[step.courseKey];
          return sum + (completion?.percent ?? 0);
        }, 0);

        const progress = totalCompletion / totalCourses;
        const requiredCompletion = lp.requiredCompletion || 0;

        let status = 'In progress';
        if (progress === 0) {
          status = 'Not started';
        } else if (progress >= requiredCompletion) {
          status = 'Completed';
        }

        let percent = 0;
        if (requiredCompletion > 0) {
          percent = Math.round((progress / requiredCompletion) * 100);
        } else {
          percent = Math.round(progress * 100);
        }

        let minDate = null;
        let maxDate = null;
        for (const course of lp.steps) {
          if (course.courseDates && course.courseDates.length > 0) {
            if (course.courseDates[0]) {
              const startDateObj = new Date(course.courseDates[0]);
              if (!minDate || startDateObj < minDate) {
                minDate = startDateObj;
              }
            }
            if (course.courseDates[1]) {
              const endDateObj = new Date(course.courseDates[1]);
              if (!maxDate || endDateObj > maxDate) {
                maxDate = endDateObj;
              }
            }
          }
        }

        return {
          ...lp,
          numCourses: totalCourses,
          status,
          minDate,
          maxDate,
          percent,
          type: 'learning_path',
          org: lp.key.match(/path-v1:([^+]+)/)[1],
          enrollmentDate: lp.enrollmentDate ? new Date(lp.enrollmentDate) : null,
        };
      });
    },
  });
};

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

            courseIds.forEach(courseId => {
              queryClient.fetchQuery({
                queryKey: QUERY_KEYS.COURSE_DETAILS(courseId),
                queryFn: () => api.fetchCourseDetails(courseId),
                staleTime: STALE_TIMES.COURSE_DETAIL,
              });
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

      const learningPaths = queryClient.getQueryData(QUERY_KEYS.ALL_LEARNING_PATHS)
        || await queryClient.fetchQuery({
          queryKey: QUERY_KEYS.ALL_LEARNING_PATHS,
          queryFn: api.fetchLearningPaths,
        });

      const completions = queryClient.getQueryData(QUERY_KEYS.COURSE_COMPLETIONS) || {};
      const completionsMap = createCompletionsMap(completions);

      const courseToLearningPathMap = createCourseToLearningPathsMap(learningPaths);

      const courses = await api.fetchCourses();
      return courses.map(course => {
        const courseWithCompletion = addCompletionStatus(course, completionsMap, course.id);
        const courseWithLearningPaths = addLearningPathNames(courseWithCompletion, courseToLearningPathMap);
        return {
          ...courseWithLearningPaths,
          type: 'course',
          enrollmentDate: course.enrollmentDate ? new Date(course.enrollmentDate) : null,
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

      const completionsMap = createCompletionsMap(completionsData);

      const results = await Promise.all(
        courseIds.map(async (courseId) => {
          const cachedCourseDetail = queryClient.getQueryData(QUERY_KEYS.COURSE_DETAILS(courseId));
          if (cachedCourseDetail) {
            return {
              ...cachedCourseDetail,
              ...addCompletionStatus(cachedCourseDetail, completionsMap, courseId),
              type: 'course',
            };
          }

          const detail = await api.fetchCourseDetails(courseId);
          queryClient.setQueryData(QUERY_KEYS.COURSE_DETAILS(courseId), {
            ...detail,
            type: 'course',
          });

          return {
            ...addCompletionStatus(detail, completionsMap, courseId),
            type: 'course',
          };
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
      const completionsMap = createCompletionsMap(completions);

      const detail = await api.fetchCourseDetails(courseKey);
      return {
        ...addCompletionStatus(detail, completionsMap, courseKey),
        type: 'course',
      };
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

export const useCourseEnrollmentStatus = (courseId) => useQuery({
  queryKey: QUERY_KEYS.COURSE_ENROLLMENT_STATUS(courseId),
  queryFn: () => api.fetchCourseEnrollmentStatus(courseId),
  enabled: !!courseId,
  staleTime: STALE_TIMES.COURSE_ENROLLMENTS,
  refetchOnWindowFocus: false,
});

export const useEnrollLearningPath = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: api.enrollInLearningPath,
    onSuccess: (_, learningPathId) => {
      queryClient.setQueryData(
        QUERY_KEYS.LEARNING_PATH_DETAIL(learningPathId),
        (oldData) => {
          if (oldData) {
            return {
              ...oldData,
              isEnrolled: true,
            };
          }
          return oldData;
        },
      );

      queryClient.setQueryData(
        QUERY_KEYS.ALL_LEARNING_PATHS,
        (oldData) => {
          if (!oldData) { return oldData; }
          return oldData.map(path => (path.key === learningPathId
            ? { ...path, isEnrolled: true }
            : path));
        },
      );
    },
  });
};

export const useEnrollCourse = (learningPathId) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (courseId) => api.enrollInCourse(learningPathId, courseId),
    onSuccess: (_, courseId) => {
      queryClient.invalidateQueries(QUERY_KEYS.COURSE_ENROLLMENT_STATUS(courseId));
    },
  });
};

export const useOrganizations = () => useQuery({
  queryKey: QUERY_KEYS.ORGANIZATIONS,
  queryFn: async () => {
    const organizations = await api.fetchOrganizations();

    const organizationsMap = {};
    organizations.forEach(org => {
      organizationsMap[org.shortName] = org;
    });

    return organizationsMap;
  },
  staleTime: STALE_TIMES.ORGANIZATIONS,
});
