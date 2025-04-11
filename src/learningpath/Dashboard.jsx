import React, { useState, useMemo } from 'react';
import {
  Spinner, Row, Col, Button,
} from '@openedx/paragon';
import { useLearningPaths, useCourses } from './data/queries';
import LearningPathCard from './LearningPathCard';
import CourseCard from './CourseCard';
import FilterPanel from './FilterPanel';

const Dashboard = () => {
  const {
    data: learningPaths,
    isLoading: isLoadingPaths,
    error: pathsError,
  } = useLearningPaths();

  const {
    data: courses,
    isLoading: isLoadingCourses,
    error: coursesError,
  } = useCourses();

  const isLoading = isLoadingPaths || isLoadingCourses;
  const error = pathsError || coursesError;

  if (error) {
    // eslint-disable-next-line no-console
    console.error('Error loading data:', error);
  }

  const items = useMemo(() => [...(courses || []), ...(learningPaths || [])], [courses, learningPaths]);

  const [showFilters, setShowFilters] = useState(false);
  const [selectedContentType, setSelectedContentType] = useState('All');
  const [selectedStatuses, setSelectedStatuses] = useState([]);

  const handleStatusChange = (status, isChecked) => {
    setSelectedStatuses(prev => {
      if (isChecked) {
        return [...prev, status];
      }
      return prev.filter(s => s !== status);
    });
  };

  const filteredItems = useMemo(() => items.filter(item => {
    const typeMatch = selectedContentType === 'All'
        || (selectedContentType === 'course' && item.type === 'course')
        || (selectedContentType === 'learning_path' && item.type === 'learning_path');
    const statusMatch = selectedStatuses.length === 0 || selectedStatuses.includes(item.status);
    return typeMatch && statusMatch;
  }), [items, selectedContentType, selectedStatuses]);

  return (
    <div className="learningpath-list">
      {isLoading ? (
        <Spinner animation="border" variant="primary" />
      ) : (
        <>
          {showFilters && (
            <div className="filter-panel sidebar open">
              <FilterPanel
                selectedContentType={selectedContentType}
                onSelectContentType={setSelectedContentType}
                selectedStatuses={selectedStatuses}
                onChangeStatus={handleStatusChange}
                onClose={() => setShowFilters(false)}
              />
            </div>
          )}
          <div className={`main-content ${showFilters ? 'shifted' : ''}`}>
            <h2>My Learning</h2>
            {!showFilters && (
              <Button onClick={() => setShowFilters(true)} variant="secondary">
                <i className="fas fa-filter" /> Filter
              </Button>
            )}
            <Row>
              {filteredItems.map(item => (item.type === 'course' ? (
                <Col key={`course-v1:${item.org}+${item.courseId}+${item.run}`} xs={12} lg={8} className="mb-4 ml-6">
                  <CourseCard course={item} />
                </Col>
              ) : (
                <Col key={item.key} xs={12} lg={8} className="mb-4 ml-6">
                  <LearningPathCard learningPath={item} />
                </Col>
              )))}
            </Row>
          </div>
        </>
      )}
    </div>
  );
};

export default Dashboard;
