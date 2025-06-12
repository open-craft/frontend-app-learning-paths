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
import { useScreenSize } from '../hooks/useScreenSize';

const Dashboard = () => {
  const { isSmall } = useScreenSize();

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
  const selectedContentTypeKey = 'lp_dashboard_contentType';
  const selectedStatusesKey = 'lp_dashboard_selectedStatuses';

  const [showFilters, setShowFilters] = useState(() => localStorage.getItem(showFiltersKey) !== 'false');
  const [selectedContentType, setSelectedContentType] = useState(() => localStorage.getItem(selectedContentTypeKey) || 'All');
  const [selectedStatuses, setSelectedStatuses] = useState(
    () => JSON.parse(localStorage.getItem(selectedStatusesKey)) || [],
  );

  useEffect(() => { localStorage.setItem(showFiltersKey, showFilters.toString()); }, [showFilters]);
  useEffect(() => {
    localStorage.setItem(selectedContentTypeKey, selectedContentType.toString());
  }, [selectedContentType]);
  useEffect(() => { localStorage.setItem(selectedStatusesKey, JSON.stringify(selectedStatuses)); }, [selectedStatuses]);

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

  const sortedItems = useMemo(() => {
    const statusOrder = { 'not started': 1, 'in progress': 2, completed: 3 };

    return [...filteredItems].sort((a, b) => {
      // Sort by status.
      const statusA = statusOrder[a.status?.toLowerCase()] || 999;
      const statusB = statusOrder[b.status?.toLowerCase()] || 999;

      if (statusA !== statusB) {
        return statusA - statusB;
      }

      // Within the status, sort by enrollment date (newest first).
      const dateA = a.enrollmentDate;
      const dateB = b.enrollmentDate;

      // Put null dates at the end.
      if (!dateA && !dateB) { return 0; }
      if (!dateA) { return 1; }
      if (!dateB) { return -1; }

      return dateB - dateA; // Newest first.
    });
  }, [filteredItems]);

  const PAGE_SIZE = getConfig().DASHBOARD_PAGE_SIZE || 10;
  const [currentPage, setCurrentPage] = useState(1);
  const totalPages = Math.ceil(sortedItems.length / PAGE_SIZE);
  const paginatedItems = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE;
    return sortedItems.slice(start, start + PAGE_SIZE);
  }, [sortedItems, currentPage, PAGE_SIZE]);

  const showingCount = Math.min(PAGE_SIZE, sortedItems.length - (currentPage - 1) * PAGE_SIZE);
  const totalCount = sortedItems.length;

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
            <div className="d-flex justify-content-between align-items-center">
              {!showFilters && (
                <Button onClick={() => setShowFilters(true)} variant="secondary" className="filter-button">
                  <Icon src={FilterAlt} /> Filter
                </Button>
              )}
              <div className={`small text-muted ${showFilters ? '' : 'ml-auto'}`}>
                Showing <b>{showingCount}</b> of <b>{totalCount}</b>
              </div>
            </div>
            <hr className={`mt-0 mb-4 ${showFilters ? 'invisible' : 'visible'}`} />
            {paginatedItems.map(item => (
              <Col xs={12} lg={11} xl={10} key={item.id || item.key} className={`p-0 mb-4 ${showFilters ? '' : 'mr-auto mx-auto'}`}>
                {item.type === 'course'
                  ? <CourseCard course={item} learningPathNames={item.learningPathNames} showFilters={showFilters} />
                  : <LearningPathCard learningPath={item} showFilters={showFilters} />}
              </Col>
            ))}
            <Pagination
              paginationLabel="learning items navigation"
              variant={isSmall ? 'reduced' : 'default'}
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
