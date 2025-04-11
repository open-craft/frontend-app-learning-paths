/**
 * Calculates the completion status based on completion percentage
 * @param {number} completion - Completion percentage (0-1)
 * @returns {Object} Object containing status and percent
 */
export const calculateCompletionStatus = (completion) => {
  const percent = completion || 0;
  let status = 'In progress';
  if (percent <= 0.0) {
    status = 'Not started';
  } else if (percent >= 1.0) {
    status = 'Completed';
  }
  return { status, percent };
};

/**
 * Adds completion status to a course
 * @param {Object} course - Course object
 * @param {Object} completionsMap - Map of course IDs to completion data
 * @param {string} courseId - Course ID
 * @returns {Object} Course object with completion status
 */
export const addCompletionStatus = (course, completionsMap, courseId) => {
  const completion = completionsMap[courseId]?.percent || 0;
  const { status, percent } = calculateCompletionStatus(completion);
  return {
    ...course,
    status,
    percent,
  };
};

/**
 * Creates a completions map from completions data
 * @param {Array} completions - Array of completion data
 * @returns {Object} Map of item keys to completion data
 */
export const createCompletionsMap = (completions) => {
  const completionsMap = {};
  completions?.forEach?.(item => {
    completionsMap[item.courseKey] = item.completion;
  });
  return completionsMap;
};
