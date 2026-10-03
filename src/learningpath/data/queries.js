import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query';
import { useCallback, useContext, useMemo } from 'react';
import { AppContext } from '@edx/frontend-platform/react';
import { getAuthenticatedUser } from '@edx/frontend-platform/auth';
import * as api from './api';
import {
  addCompletionStatus,
  addLearningPaths,
  calculateCompletionStatus,
  createCompletionsMap,
  createCourseToLearningPathsMap,
} from './dataUtils';

// Query keys
export const getQueryKeys = (scope = getAuthenticatedUser()?.username || null) => {
  const scoped = (...key) => ['learningPathsUser', scope, ...key];
  return {
    IS_AUTHENTICATED: scope !== null,
    API: Object.fromEntries(Object.entries(api).map(([name, operation]) => [name, (...args) => {
      if ((getAuthenticatedUser()?.username || null) !== scope) {
        return Promise.reject(new Error('Learning Paths identity changed; retry under the current identity.'));
      }
      return operation(...args);
    }])),
    ALL_LEARNING_PATHS: scoped('learningPaths'),
    LEARNING_PATH_DETAIL: (key) => scoped('learningPath', key),
    LEARNING_PATH_PROGRESS: (key) => scoped('learningPathProgress', key),
    LEARNER_DASHBOARD: scoped('learnerDashboard'),
    COURSE_DETAILS: (courseId) => scoped('course', courseId),
    COURSE_COMPLETIONS: scoped('courseCompletions'),
    COURSE_ENROLLMENT_STATUS: (courseId) => scoped('courseEnrollmentStatus', courseId),
    ORGANIZATIONS: scoped('organizations'),
    CREDENTIAL_CONFIGURATION: (learningContextKey) => scoped('credentialConfiguration', learningContextKey),
  };
};

// Subscribe to native identity changes and keep pending/cache data in its original principal scope.
function useScopedQueryKeys() {
  const { authenticatedUser } = useContext(AppContext);
  return useMemo(() => getQueryKeys(authenticatedUser?.username || null), [authenticatedUser?.username]);
}

// Stale time configurations
export const STALE_TIMES = {
  LEARNING_PATHS: 5 * 60 * 1000, // 5 minutes
  LEARNING_PATH_DETAIL: 5 * 60 * 1000, // 5 minutes

  COURSES: 5 * 60 * 1000, // 5 minutes
  COURSE_DETAIL: 5 * 60 * 1000, // 5 minutes
  COURSE_ENROLLMENTS: 60 * 1000, // 1 minute

  COMPLETIONS: 60 * 1000, // 1 minute

  ORGANIZATIONS: 60 * 60 * 1000, // 1 hour
  CREDENTIALS: 5 * 60 * 1000, // 5 minutes
};

// Learning Paths Queries
export const useLearningPaths = () => {
  const queryClient = useQueryClient();
  const queryKeys = useScopedQueryKeys();

  return useQuery({
    queryKey: queryKeys.ALL_LEARNING_PATHS,
    queryFn: async () => {
      await queryClient.prefetchQuery({
        queryKey: queryKeys.COURSE_COMPLETIONS,
        queryFn: queryKeys.API.fetchAllCourseCompletions,
      });

      const completions = queryClient.getQueryData(queryKeys.COURSE_COMPLETIONS) || {};
      const completionsMap = createCompletionsMap(completions);

      const learningPathList = await queryKeys.API.fetchLearningPaths();

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

        let hasOptionalCompletion = false;
        let hasUnearnedOptionalCompletion = false;
        const totalCompletion = lp.steps.reduce((sum, step) => {
          const completionData = completionsMap[step.courseKey];
          const optionalPossible = completionData?.optionalCompletion?.possible ?? 0;
          const optionalEarned = completionData?.optionalCompletion?.earned ?? 0;
          if (optionalPossible > 0) {
            hasOptionalCompletion = true;
            if (optionalPossible > optionalEarned) {
              hasUnearnedOptionalCompletion = true;
            }
          }
          return sum + (completionData?.completion?.percent ?? 0);
        }, 0);

        const percent = totalCompletion / totalCourses;
        const { status } = calculateCompletionStatus(percent);

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
          hasOptionalCompletion,
          hasUnearnedOptionalCompletion,
          type: 'learning_path',
          org: lp.key.match(/path-v1:([^+]+)/)[1],
          enrollmentDate: lp.enrollmentDate ? new Date(lp.enrollmentDate) : null,
        };
      });
    },
  });
};

export const useLearningPathDetail = (key) => {
  const queryKeys = useScopedQueryKeys();
  return useQuery({
    queryKey: queryKeys.LEARNING_PATH_DETAIL(key),
    queryFn: () => queryKeys.API.fetchLearningPathDetail(key),
    enabled: !!key,
  });
};

// Hook for prefetching learning path details and all related data
export const usePrefetchLearningPathDetail = () => {
  const queryClient = useQueryClient();
  const queryKeys = useScopedQueryKeys();

  return (key) => {
    if (!key) {
      return;
    }

    queryClient.fetchQuery({
      queryKey: queryKeys.LEARNING_PATH_DETAIL(key),
      queryFn: () => queryKeys.API.fetchLearningPathDetail(key),
      staleTime: STALE_TIMES.LEARNING_PATH_DETAIL,
    })
      .then(learningPathData => {
        if (!learningPathData?.steps || learningPathData.steps.length === 0) {
          return;
        }

        const courseIds = learningPathData.steps.map(step => step.courseKey);

        queryClient.fetchQuery({
          queryKey: queryKeys.COURSE_COMPLETIONS,
          queryFn: queryKeys.API.fetchAllCourseCompletions,
          staleTime: STALE_TIMES.COMPLETIONS,
        })
          .then(completionsData => {
            const completionsMap = {};
            completionsData?.forEach?.(item => {
              completionsMap[item.courseKey] = item.completion;
            });

            courseIds.forEach(courseId => {
              queryClient.fetchQuery({
                queryKey: queryKeys.COURSE_DETAILS(courseId),
                queryFn: () => queryKeys.API.fetchCourseDetails(courseId),
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
export const useLearnerDashboard = () => {
  const queryClient = useQueryClient();
  const queryKeys = useScopedQueryKeys();

  return useQuery({
    queryKey: queryKeys.LEARNER_DASHBOARD,
    enabled: queryKeys.IS_AUTHENTICATED,
    queryFn: async () => {
      await queryClient.prefetchQuery({
        queryKey: queryKeys.COURSE_COMPLETIONS,
        queryFn: queryKeys.API.fetchAllCourseCompletions,
      });

      const learningPaths = queryClient.getQueryData(queryKeys.ALL_LEARNING_PATHS)
        || await queryClient.fetchQuery({
          queryKey: queryKeys.ALL_LEARNING_PATHS,
          queryFn: queryKeys.API.fetchLearningPaths,
        });

      const completions = queryClient.getQueryData(queryKeys.COURSE_COMPLETIONS) || {};
      const completionsMap = createCompletionsMap(completions);

      const courseToLearningPathMap = createCourseToLearningPathsMap(learningPaths);

      const dashboardData = await queryKeys.API.fetchLearnerDashboard();
      const processedCourses = dashboardData.courses.map(course => {
        const courseWithCompletion = addCompletionStatus(course, completionsMap, course.id);
        const courseWithLearningPaths = addLearningPaths(courseWithCompletion, courseToLearningPathMap);
        return {
          ...courseWithLearningPaths,
          type: 'course',
          org: course.id ? course.id.match(/course-v1:([^+]+)/)?.[1] : null,
          enrollmentDate: course.enrollmentDate ? new Date(course.enrollmentDate) : null,
        };
      });

      return {
        courses: processedCourses,
        emailConfirmation: dashboardData.emailConfirmation,
        enterpriseDashboard: dashboardData.enterpriseDashboard,
      };
    },
  });
};

export const useCoursesByIds = (courseIds) => {
  const queryClient = useQueryClient();
  const queryKeys = useScopedQueryKeys();

  return useQuery({
    queryKey: [...queryKeys.COURSE_COMPLETIONS, 'coursesByIds', ...(courseIds || [])],
    queryFn: async () => {
      let completionsData = queryClient.getQueryData(queryKeys.COURSE_COMPLETIONS);
      if (!completionsData) {
        completionsData = await queryClient.fetchQuery({
          queryKey: queryKeys.COURSE_COMPLETIONS,
          queryFn: queryKeys.API.fetchAllCourseCompletions,
        });
      }

      const completionsMap = createCompletionsMap(completionsData);

      const results = await Promise.all(
        courseIds.map(async (courseId) => {
          const cachedCourseDetail = queryClient.getQueryData(queryKeys.COURSE_DETAILS(courseId));
          if (cachedCourseDetail) {
            return {
              ...cachedCourseDetail,
              ...addCompletionStatus(cachedCourseDetail, completionsMap, courseId),
              type: 'course',
              org: courseId ? courseId.match(/course-v1:([^+]+)/)?.[1] : null,
            };
          }

          const detail = await queryKeys.API.fetchCourseDetails(courseId);
          if (!detail) {
            return null;
          }
          queryClient.setQueryData(queryKeys.COURSE_DETAILS(courseId), {
            ...detail,
            type: 'course',
            org: courseId ? courseId.match(/course-v1:([^+]+)/)?.[1] : null,
          });

          return {
            ...addCompletionStatus(detail, completionsMap, courseId),
            type: 'course',
            org: courseId ? courseId.match(/course-v1:([^+]+)/)?.[1] : null,
          };
        }),
      );

      return results.filter(Boolean);
    },
    enabled: courseIds && courseIds.length > 0,
  });
};

export const useCourseDetail = (courseKey) => {
  const queryClient = useQueryClient();
  const queryKeys = useScopedQueryKeys();

  return useQuery({
    queryKey: queryKeys.COURSE_DETAILS(courseKey),
    queryFn: async () => {
      await queryClient.prefetchQuery({
        queryKey: queryKeys.COURSE_COMPLETIONS,
        queryFn: queryKeys.API.fetchAllCourseCompletions,
      });

      queryClient.prefetchQuery({
        queryKey: queryKeys.CREDENTIAL_CONFIGURATION(courseKey),
        queryFn: () => queryKeys.API.fetchCredentialConfiguration(courseKey),
        staleTime: STALE_TIMES.CREDENTIALS,
      });

      const completions = queryClient.getQueryData(queryKeys.COURSE_COMPLETIONS) || {};
      const completionsMap = createCompletionsMap(completions);

      const detail = await queryKeys.API.fetchCourseDetails(courseKey);
      if (!detail) {
        return null;
      }
      return {
        ...addCompletionStatus(detail, completionsMap, courseKey),
        type: 'course',
        org: courseKey ? courseKey.match(/course-v1:([^+]+)/)?.[1] : null,
      };
    },
    enabled: !!courseKey,
  });
};

// Hook to prefetch course details when hovering
export const usePrefetchCourseDetail = (courseId) => {
  const queryClient = useQueryClient();
  const queryKeys = useScopedQueryKeys();

  const prefetchCourse = useCallback(() => {
    if (courseId) {
      try {
        queryClient.fetchQuery({
          queryKey: queryKeys.COURSE_DETAILS(courseId),
          queryFn: () => queryKeys.API.fetchCourseDetails(courseId),
          staleTime: STALE_TIMES.COURSE_DETAIL,
        });

        queryClient.prefetchQuery({
          queryKey: queryKeys.CREDENTIAL_CONFIGURATION(courseId),
          queryFn: () => queryKeys.API.fetchCredentialConfiguration(courseId),
          staleTime: STALE_TIMES.CREDENTIALS,
        });
      } catch (error) {
        // eslint-disable-next-line no-console
        console.error('Error prefetching course data:', error);
      }
    }
  }, [courseId, queryClient, queryKeys]);

  return prefetchCourse;
};

export const useCourseEnrollmentStatus = (courseId) => {
  const queryKeys = useScopedQueryKeys();
  return useQuery({
    queryKey: queryKeys.COURSE_ENROLLMENT_STATUS(courseId),
    queryFn: () => queryKeys.API.fetchCourseEnrollmentStatus(courseId),
    enabled: !!courseId && queryKeys.IS_AUTHENTICATED,
    staleTime: STALE_TIMES.COURSE_ENROLLMENTS,
    refetchOnWindowFocus: false,
  });
};

export const useEnrollLearningPath = () => {
  const queryClient = useQueryClient();
  const queryKeys = useScopedQueryKeys();

  const mutation = useMutation({
    mutationFn: ({ learningPathId, keys }) => keys.API.enrollInLearningPath(learningPathId),
    onSuccess: (result, { learningPathId, keys }) => {
      if (!result.success) { return; }
      queryClient.setQueryData(
        keys.LEARNING_PATH_DETAIL(learningPathId),
        (oldData) => (oldData ? { ...oldData, enrollmentDate: Date.now() } : oldData),
      );
      queryClient.setQueryData(
        keys.ALL_LEARNING_PATHS,
        (oldData) => oldData?.map(path => (path.key === learningPathId
          ? { ...path, enrollmentDate: Date.now() }
          : path)),
      );
    },
  });

  return {
    ...mutation,
    mutate: (learningPathId, options) => mutation.mutate({ learningPathId, keys: queryKeys }, options),
    mutateAsync: (learningPathId, options) => mutation.mutateAsync({ learningPathId, keys: queryKeys }, options),
  };
};

export const useEnrollCourse = (learningPathId) => {
  const queryClient = useQueryClient();
  const queryKeys = useScopedQueryKeys();

  const mutation = useMutation({
    mutationFn: ({ courseId, pathId, keys }) => keys.API.enrollInCourse(pathId, courseId),
    onSuccess: (result, { courseId, keys }) => {
      if (!result.success) { return; }
      queryClient.invalidateQueries(keys.COURSE_ENROLLMENT_STATUS(courseId));
    },
  });

  return {
    ...mutation,
    mutate: (courseId, options) => mutation.mutate({ courseId, pathId: learningPathId, keys: queryKeys }, options),
    mutateAsync: (courseId, options) => mutation.mutateAsync({
      courseId, pathId: learningPathId, keys: queryKeys,
    }, options),
  };
};

export const useOrganizations = () => {
  const queryKeys = useScopedQueryKeys();
  return useQuery({
    queryKey: queryKeys.ORGANIZATIONS,
    queryFn: async () => {
      const organizations = await queryKeys.API.fetchOrganizations();

      const organizationsMap = {};
      organizations.forEach(org => {
        organizationsMap[org.shortName] = org;
      });

      return organizationsMap;
    },
    enabled: queryKeys.IS_AUTHENTICATED,
    staleTime: STALE_TIMES.ORGANIZATIONS,
  });
};

export const useCredentialConfiguration = (learningContextKey) => {
  const queryKeys = useScopedQueryKeys();
  return useQuery({
    queryKey: queryKeys.CREDENTIAL_CONFIGURATION(learningContextKey),
    queryFn: () => queryKeys.API.fetchCredentialConfiguration(learningContextKey),
    enabled: !!learningContextKey && queryKeys.IS_AUTHENTICATED,
    staleTime: STALE_TIMES.CREDENTIALS,
  });
};
