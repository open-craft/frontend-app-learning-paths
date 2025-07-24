import React from 'react';
import ProgressIndicator from './ProgressIndicator';
import { CourseCardWithEnrollment } from '../CourseCard';
import { Course } from './types';

interface CourseWithProgressProps {
  course: Course;
  learningPathId: string;
  enrollmentDateInLearningPath?: string | null;
  onCourseClick: () => void;
}

const CourseWithProgress: React.FC<CourseWithProgressProps> = ({
  course,
  learningPathId,
  enrollmentDateInLearningPath,
  onCourseClick,
}) => (
  <div className="course-with-progress">
    <div className="progress-indicator-wrapper">
      <ProgressIndicator status={course.status} />
    </div>
    <div className="course-card-wrapper">
      <CourseCardWithEnrollment
        course={course}
        learningPathId={learningPathId}
        isEnrolledInLearningPath={enrollmentDateInLearningPath != null}
        onClick={onCourseClick}
      />
    </div>
    <div
      className="progress-connector position-absolute"
      style={{
        top: '30px',
        left: '17px',
        width: '2px',
        backgroundColor: '#E0E0E0',
        zIndex: 1,
        bottom: '-36px',
      }}
    />
  </div>
);

export default CourseWithProgress;
