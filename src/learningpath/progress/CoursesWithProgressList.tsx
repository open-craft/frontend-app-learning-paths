import React from 'react';
import CourseWithProgress from './CourseWithProgress';
import ProgressIndicator from './ProgressIndicator';
import { Course } from './types';

interface CompletionMessageProps {
  completed: 'Completed' | 'Not started';
}

const CompletionMessage: React.FC<CompletionMessageProps> = ({ completed }) => (
  <div className="course-with-progress">
    <div className="progress-indicator-wrapper">
      <ProgressIndicator status={completed} />
    </div>
    <div className="course-card-wrapper">
      <div className="completion-message">
        <div className="font-weight-bold mb-2" style={{ color: 'black', fontSize: '1.375rem', marginTop: '0.125rem' }}>
          Congratulations!
        </div>
        <div className="text-muted">
          You&apos;ve completed the Learning Path. We can&apos;t wait to see where these skills take you next.
        </div>
      </div>
    </div>
  </div>
);

interface CoursesWithProgressListProps {
  courses?: Course[];
  learningPathId: string;
  enrollmentDateInLearningPath?: string | null;
  onCourseClick: (courseId: string) => void;
}

const CoursesWithProgressList: React.FC<CoursesWithProgressListProps> = ({
  courses = [],
  learningPathId,
  enrollmentDateInLearningPath = null,
  onCourseClick,
}) => {
  const finalIndicatorStatus: 'Completed' | 'Not started' = courses.every(course => course.status.toLowerCase() === 'completed') ? 'Completed' : 'Not started';

  return (
    <div className="courses-with-progress-list">
      {courses.map((course) => (
        <div key={course.id} className="mb-3">
          <CourseWithProgress
            course={course}
            learningPathId={learningPathId}
            enrollmentDateInLearningPath={enrollmentDateInLearningPath}
            onCourseClick={() => onCourseClick(course.id)}
          />
        </div>
      ))}
      <div className="mb-3">
        <CompletionMessage completed={finalIndicatorStatus} />
      </div>
    </div>
  );
};

export default CoursesWithProgressList;
