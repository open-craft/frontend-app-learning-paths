import React, { useState, useMemo, useEffect } from 'react';
import {
  Spinner, Col, Button, Pagination, Icon, SearchField,
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

  const [searchQuery, setSearchQuery] = useState('');

  const showFiltersKey = 'lp_dashboard_showFilters';
  const [showFilters, setShowFilters] = useState(() => localStorage.getItem(showFiltersKey) !== 'false');
  useEffect(() => { localStorage.setItem(showFiltersKey, showFilters.toString()); }, [showFilters]);

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
    const searchMatch = searchQuery === ''
      || (item.displayName && item.displayName.toLowerCase().includes(searchQuery.toLowerCase()))
      || (item.name && item.name.toLowerCase().includes(searchQuery.toLowerCase()));
    return typeMatch && statusMatch && searchMatch;
  }), [items, selectedContentType, selectedStatuses, searchQuery]);
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
  // Reset pagination when using filters or search.
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, selectedContentType, selectedStatuses]);

  return (
    <div className="dashboard m-4.5">
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
            <div className="dashboard-header d-flex justify-content-between align-items-center">
              <h2>My Learning</h2>
              <SearchField
                onClear={() => setSearchQuery('')}
                onChange={setSearchQuery}
                onSubmit={() => {}}
                value={searchQuery}
                placeholder="Search"
              />
            </div>
            {!showFilters && (
              <Button onClick={() => setShowFilters(true)} variant="secondary" className="filter-button">
                <Icon src={FilterAlt} /> Filter
              </Button>
            )}
            <hr className={`mt-0 mb-4 ${showFilters ? 'invisible' : 'visible'}`} />
            {paginatedItems.map(item => (
              <Col xs={12} lg={11} xl={10} key={item.id || item.key} className={`p-0 mb-4 ${showFilters ? '' : 'mr-auto mx-auto'}`}>
                {item.type === 'course'
                  ? <CourseCard course={item} showFilters={showFilters} />
                  : <LearningPathCard learningPath={item} showFilters={showFilters} />}
              </Col>
            ))}
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
