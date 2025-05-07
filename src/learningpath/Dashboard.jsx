import React, { useState, useMemo, useEffect } from 'react';
import {
  Spinner, Row, Col, Button, Pagination, Icon,
} from '@openedx/paragon';
import { getConfig } from '@edx/frontend-platform';
import { FilterAlt } from '@openedx/paragon/icons';
import { useLearningPaths, useCourses } from './data/queries';
import LearningPathCard from './LearningPathCard';
import { CourseCard } from './CourseCard';
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

  const PAGE_SIZE = getConfig().DASHBOARD_PAGE_SIZE || 10;
  const [currentPage, setCurrentPage] = useState(1);
  const totalPages = Math.ceil(filteredItems.length / PAGE_SIZE);
  const paginatedItems = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE;
    return filteredItems.slice(start, start + PAGE_SIZE);
  }, [filteredItems, currentPage, PAGE_SIZE]);
  useEffect(() => {
    // Add a timeout to ensure DOM updates are complete.
    const id = setTimeout(() => window.scrollTo({ top: 0, behavior: 'smooth' }), 10);
    return () => clearTimeout(id);
  }, [currentPage]);

  return (
    <div className="learningpath-list m-4.5">
      {isLoading ? (
        <div className="d-flex justify-content-center align-items-center vh-100">
          <Spinner animation="border" variant="primary" />
        </div>
      ) : (
        <>
          {showFilters && (
            <div className="filter-panel sidebar position-absolute open">
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
              <Button onClick={() => setShowFilters(true)} variant="secondary" className="filter-button">
                <Icon src={FilterAlt} /> Filter
              </Button>
            )}
            <hr className="mt-0 mb-4" />
            <Row>
              {paginatedItems.map(item => (item.type === 'course' ? (
                <Col key={item.id} xs={12} lg={8} className={`mb-4 ${showFilters ? '' : 'mx-lg-6'}`}>
                  <CourseCard course={item} />
                </Col>
              ) : (
                <Col key={item.key} xs={12} lg={8} className={`mb-4 ${showFilters ? '' : 'mx-lg-6'}`}>
                  <LearningPathCard learningPath={item} />
                </Col>
              )))}
            </Row>
            <Pagination
              paginationLabel="learning items navigation"
              pageCount={totalPages}
              currentPage={currentPage}
              onPageSelect={page => setCurrentPage(page)}
              className="d-flex justify-content-center mt-4"
            />
          </div>
        </>
      )}
    </div>
  );
};

export default Dashboard;
