import React, { useEffect, useState, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  Spinner, Row, Col, Button,
} from '@openedx/paragon';
import { fetchLearningPathways, fetchCourses } from './data/thunks';
import LearningPathCard from './LearningPathCard';
import CourseCard from './CourseCard';
import FilterPanel from './FilterPanel';

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

  const isLoading = lpFetching || coursesFetching;

  const allErrors = [].concat(lpErrors || [], coursesErrors || []);
  if (allErrors.length > 0) {
    // eslint-disable-next-line no-console
    console.error('Error loading learning paths:', allErrors);
  }

  const items = useMemo(() => [...courses, ...learningPathways], [courses, learningPathways]);

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
                <Col key={item.id} xs={12} lg={8} className="mb-4 ml-6">
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
}
