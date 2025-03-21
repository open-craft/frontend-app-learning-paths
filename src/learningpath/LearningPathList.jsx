import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Spinner, Alert, Row, Col } from '@edx/paragon';
import { fetchLearningPathways, fetchCourses } from './data/thunks';
import LearningPathCard from './LearningPathCard';
import CourseCard from './CourseCard';

export default function LearningPathList() {
  const dispatch = useDispatch();
  const { 
    fetching: lpFetching,
    learningPathways,
    errors: lpErrors,
  } = useSelector(state => state.learningPath);
  const {
    fetching: coursesFetching,
    courses,
    error: coursesErrors,
  } = useSelector(state => state.courses);

  useEffect(() => {
    dispatch(fetchLearningPathways());
    dispatch(fetchCourses());
  }, [dispatch]);

  if (lpFetching || coursesFetching) {
    return <Spinner animation="border" variant="primary" />;
  }

  const allErrors = [].concat(lpErrors || [], coursesErrors || []);
  if (allErrors.length > 0) {
    console.error('Error loading learning pathways:', allErrors);
  }

  return (
    <div className="learningpath-list">
      <h2>Learning Pathways</h2>
      <Row>
        {learningPathways.map(path => (
          <Col key={path.uuid} xs={12} lg={8} className="mb-4 ml-6">
            <LearningPathCard learningPath={path} />
          </Col>
        ))}
        {courses.map(course => (
          <Col key={course.key} xs={12} lg={8} className="mb-4 ml-6">
            <CourseCard course={course} />
          </Col>
        ))}
      </Row>
    </div>
  );
}
