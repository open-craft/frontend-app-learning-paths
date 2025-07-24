import React, {
  useState, useMemo, useEffect, useRef, useCallback,
} from 'react';
import { Link } from 'react-router-dom';
import {
  Spinner, Col, Button, Pagination, Icon, IconButton, SearchField, Image, Bubble, Alert,
} from '@openedx/paragon';
import { getConfig } from '@edx/frontend-platform';
import { FilterAlt, FilterList, Search } from '@openedx/paragon/icons';
import { useLearningPaths, useLearnerDashboard } from './data/queries';
import LearningPathCard from './LearningPathCard';
import { CourseCard } from './CourseCard';
import FilterPanel from './FilterPanel';
import { useScreenSize } from '../hooks/useScreenSize';
import noResultsSVG from '../assets/no_results.svg';

const Dashboard = () => {
  const { isSmall } = useScreenSize();

  const {
    data: learningPaths,
    isLoading: isLoadingPaths,
    error: pathsError,
  } = useLearningPaths();

  const {
    data: learnerDashboardData,
    isLoading: isLoadingCourses,
    error: coursesError,
  } = useLearnerDashboard();

  const courses = learnerDashboardData?.courses;
  const emailConfirmation = learnerDashboardData?.emailConfirmation;
  const enterpriseDashboard = learnerDashboardData?.enterpriseDashboard;

  const isLoading = isLoadingPaths || isLoadingCourses;
  const error = pathsError || coursesError;

  if (error) {
    // eslint-disable-next-line no-console
    console.error('Error loading data:', error);
  }

  const items = useMemo(() => {
    // If email confirmation is needed, return empty array to hide all items.
    if (emailConfirmation?.isNeeded) {
      return [];
    }
    return [...(courses || []), ...(learningPaths || [])];
  }, [courses, learningPaths, emailConfirmation]);

  const [searchQuery, setSearchQuery] = useState('');
  const [showMobileSearch, setShowMobileSearch] = useState(false);
  const mobileSearchRef = useRef(null);

  const handleMobileSearchClick = () => {
    setShowMobileSearch(true);
    // Focus the search field after it becomes visible.
    setTimeout(() => {
      if (mobileSearchRef.current) {
        const inputElement = mobileSearchRef.current.querySelector('input');
        if (inputElement) {
          inputElement.focus();
        }
      }
    }, 0);
  };

  const handleMobileSearchBlur = () => {
    // Hide mobile search when user taps outside and the search query is empty.
    if (isSmall && !searchQuery) {
      setShowMobileSearch(false);
    }
  };

  const showFiltersKey = 'lp_dashboard_showFilters';
  const selectedContentTypeKey = 'lp_dashboard_contentType';
  const selectedStatusesKey = 'lp_dashboard_selectedStatuses';
  const selectedDateStatusesKey = 'lp_dashboard_selectedDateStatuses';

  const [showFilters, setShowFilters] = useState(() => localStorage.getItem(showFiltersKey) === 'true');
  const [selectedContentType, setSelectedContentType] = useState(() => localStorage.getItem(selectedContentTypeKey) || 'All');
  const [selectedStatuses, setSelectedStatuses] = useState(
    () => JSON.parse(localStorage.getItem(selectedStatusesKey)) || [],
  );
  const [selectedDateStatuses, setSelectedDateStatuses] = useState(
    () => JSON.parse(localStorage.getItem(selectedDateStatusesKey)) || [],
  );

  useEffect(() => { localStorage.setItem(showFiltersKey, showFilters.toString()); }, [showFilters]);
  useEffect(() => {
    localStorage.setItem(selectedContentTypeKey, selectedContentType.toString());
  }, [selectedContentType]);
  useEffect(() => { localStorage.setItem(selectedStatusesKey, JSON.stringify(selectedStatuses)); }, [selectedStatuses]);
  useEffect(() => {
    localStorage.setItem(selectedDateStatusesKey, JSON.stringify(selectedDateStatuses));
  }, [selectedDateStatuses]);

  const handleStatusChange = (status, isChecked) => {
    setSelectedStatuses(prev => {
      if (isChecked) {
        return [...prev, status];
      }
      return prev.filter(s => s !== status);
    });
  };

  const handleDateStatusChange = (dateStatus, isChecked) => {
    setSelectedDateStatuses(prev => {
      if (isChecked) {
        return [...prev, dateStatus];
      }
      return prev.filter(s => s !== dateStatus);
    });
  };

  const handleClearFilters = () => {
    setSelectedContentType('All');
    setSelectedStatuses([]);
    setSelectedDateStatuses([]);
  };

  const activeFiltersCount = useMemo(
    () => (selectedContentType !== 'All') + selectedStatuses.length + selectedDateStatuses.length,
    [selectedContentType, selectedStatuses, selectedDateStatuses],
  );

  const getItemDates = (item) => {
    if (item.type === 'course') {
      return {
        startDate: item.startDate ? new Date(item.startDate) : null,
        endDate: item.endDate ? new Date(item.endDate) : null,
      };
    }
    if (item.type === 'learning_path') {
      return {
        startDate: item.minDate ? new Date(item.minDate) : null,
        endDate: item.maxDate ? new Date(item.maxDate) : null,
      };
    }
    return { startDate: null, endDate: null };
  };

  const getDateStatus = useCallback((item) => {
    const currentDate = new Date();
    const { startDate, endDate } = getItemDates(item);

    if (startDate && startDate > currentDate) {
      return 'Upcoming';
    }
    if (endDate && endDate < currentDate) {
      return 'Ended';
    }
    return 'Open';
  }, []);

  const filteredItems = useMemo(() => items.filter(item => {
    const typeMatch = selectedContentType === 'All'
      || (selectedContentType === 'course' && item.type === 'course')
      || (selectedContentType === 'learning_path' && item.type === 'learning_path');
    const statusMatch = selectedStatuses.length === 0 || selectedStatuses.includes(item.status);
    const dateStatusMatch = selectedDateStatuses.length === 0 || selectedDateStatuses.includes(getDateStatus(item));
    const searchMatch = searchQuery === ''
      || (item.displayName && item.displayName.toLowerCase().includes(searchQuery.toLowerCase()))
      || (item.name && item.name.toLowerCase().includes(searchQuery.toLowerCase()));
    return typeMatch && statusMatch && dateStatusMatch && searchMatch;
  }), [items, selectedContentType, selectedStatuses, selectedDateStatuses, searchQuery, getDateStatus]);

  const sortedItems = useMemo(() => {
    const statusOrder = { 'not started': 1, 'in progress': 2, completed: 3 };
    const dateStatusOrder = { Upcoming: 1, Open: 2, Ended: 3 };

    return [...filteredItems].sort((a, b) => {
      // 1. Sort by start date category.
      const dateStatusA = dateStatusOrder[getDateStatus(a)] || 999;
      const dateStatusB = dateStatusOrder[getDateStatus(b)] || 999;

      if (dateStatusA !== dateStatusB) {
        return dateStatusA - dateStatusB;
      }

      // 2. Sort by progress status.
      const statusA = statusOrder[a.status?.toLowerCase()] || 999;
      const statusB = statusOrder[b.status?.toLowerCase()] || 999;

      if (statusA !== statusB) {
        return statusA - statusB;
      }

      // 3. Sort alphabetically by name.
      const nameA = (a.displayName || a.name || '').toLowerCase();
      const nameB = (b.displayName || b.name || '').toLowerCase();

      return nameA.localeCompare(nameB);
    });
  }, [filteredItems, getDateStatus]);

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
  }, [searchQuery, selectedContentType, selectedStatuses, selectedDateStatuses]);

  return (
    <>
      {emailConfirmation?.isNeeded && (
        <Alert className="account-activation m-0 p-2 rounded-0 text-center">
          Activate your account! Check your inbox for an account activation link from {getConfig().SITE_NAME}.
          If you need help, <Link to={`${getConfig().LMS_BASE_URL}/contact`} target="_blank" rel="noopener noreferrer">contact us</Link>.
        </Alert>
      )}
      {!emailConfirmation?.isNeeded && enterpriseDashboard?.isLearnerPortalEnabled && (
        <Alert className="enterprise-dashboard m-0 p-2 rounded-0 text-center">
          You have access to the <b>{enterpriseDashboard.label}</b> dashboard. To access the courses available to you through {enterpriseDashboard.label}, visit the{' '}
          <Link to={`${enterpriseDashboard.url}?utm_source=lms_dashboard_banner`}>
            {enterpriseDashboard.label} dashboard
          </Link>.
        </Alert>
      )}
      <div className="dashboard m-4.5">
        {isLoading ? (
          <div className="d-flex justify-content-center align-items-center vh-100">
            <Spinner animation="border" variant="primary" />
          </div>
        ) : (
          <>
            {showFilters && (
              <div className={`filter-panel sidebar position-absolute open ${isSmall ? 'mobile' : ''}`}>
                <FilterPanel
                  selectedContentType={selectedContentType}
                  onSelectContentType={setSelectedContentType}
                  selectedStatuses={selectedStatuses}
                  onChangeStatus={handleStatusChange}
                  selectedDateStatuses={selectedDateStatuses}
                  onChangeDateStatus={handleDateStatusChange}
                  onClose={() => setShowFilters(false)}
                  isSmall={isSmall}
                  onClearAll={handleClearFilters}
                />
              </div>
            )}
            <div className={`dashboard-content ${showFilters ? 'shifted' : ''} ${showFilters && isSmall ? 'd-none' : ''}`}>
              <div className="dashboard-header d-flex justify-content-between align-items-center">
                <h2>My Learning</h2>
                {!isSmall ? (
                  <SearchField
                    onClear={() => setSearchQuery('')}
                    onChange={setSearchQuery}
                    onSubmit={() => {}}
                    value={searchQuery}
                    placeholder="Search"
                  />
                ) : (
                  <div>
                    <IconButton src={Search} iconAs={Icon} variant="black" alt="Search" onClick={handleMobileSearchClick} />
                    <div className="d-inline-block">
                      <IconButton src={FilterList} iconAs={Icon} variant="black" alt="Filter" onClick={() => setShowFilters(true)} />
                      {activeFiltersCount > 0 && (
                        <Bubble className="position-absolute mt-4 ml-n3.5">{activeFiltersCount}</Bubble>
                      )}
                    </div>
                  </div>
                )}
              </div>
              {isSmall && showMobileSearch && (
                <div className="mobile-search" ref={mobileSearchRef}>
                  <SearchField
                    onClear={() => setSearchQuery('')}
                    onChange={setSearchQuery}
                    onSubmit={() => {}}
                    onBlur={handleMobileSearchBlur}
                    value={searchQuery}
                    placeholder="Search"
                  />
                </div>
              )}
              <div className="d-flex justify-content-between align-items-center">
                {!showFilters && !isSmall && (
                  <Button onClick={() => setShowFilters(true)} variant="secondary" className="filter-button border-0">
                    <Icon src={FilterAlt} /> Filter
                  </Button>
                )}
                <div className="small text-muted">
                  Showing <b>{showingCount}</b> of <b>{totalCount}</b>
                </div>
              </div>
              <hr className={`mt-0 mb-4 ${showFilters || isSmall ? 'invisible' : 'visible'}`} />
              {sortedItems.length === 0 ? (
                <div className="d-flex flex-column align-items-center justify-content-center text-center py-5">
                  <Image src={noResultsSVG} alt="No results" className="mb-4" />
                  <div>
                    <div className="h3 my-2">No matching results</div>
                    <div className="text-muted">Try another search or clear your filters</div>
                  </div>
                </div>
              ) : (
                <>
                  {paginatedItems.map(item => (
                    <Col xs={12} lg={11} xl={10} key={item.id || item.key} className={`dashboard-item p-0 mb-4 ${showFilters ? '' : 'mr-auto mx-auto'}`}>
                      {item.type === 'course'
                        ? (
                          <CourseCard
                            course={item}
                            relatedLearningPaths={item.learningPaths}
                            showFilters={showFilters}
                          />
                        )
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
                </>
              )}
            </div>
          </>
        )}
      </div>
    </>
  );
};

export default Dashboard;
