import React, { useMemo, useState, useEffect } from 'react';
import {
  useParams, Link, useLocation, useNavigate,
} from 'react-router-dom';
import {
  Row, Col, Spinner, Nav, Icon, ModalLayer, Button,
} from '@openedx/paragon';
import {
  Person,
  Award,
  Calendar,
  FormatListBulleted,
  AccessTimeFilled,
  ChevronLeft,
} from '@openedx/paragon/icons';
import { useLearningPathDetail, useCoursesByIds, useEnrollLearningPath } from './data/queries';
import { CourseCard, CourseCardWithEnrollment } from './CourseCard';
import CourseDetailPage from './CourseDetails';

const LearningPathDetailPage = () => {
  const { key } = useParams();
  const [selectedCourseKey, setSelectedCourseKey] = useState(null);
  const [selectedPathTitle, setSelectedPathTitle] = useState('');
  const location = useLocation();
  const navigate = useNavigate();
  const [enrolling, setEnrolling] = useState(false);

  // Get the requested view mode from URL params.
  const requestedEnrolledView = useMemo(
    () => new URLSearchParams(location.search).get('view') === 'enrolled',
    [location.search],
  );

  const {
    data: detail,
    isLoading: loadingDetail,
    error: detailError,
  } = useLearningPathDetail(key);

  // Check if the user can access the enrolled view.
  const isEnrolledView = useMemo(
    () => requestedEnrolledView && detail?.isEnrolled === true,
    [requestedEnrolledView, detail?.isEnrolled],
  );

  // Redirect unenrolled users trying to access the enrolled view.
  useEffect(() => {
    if (!loadingDetail && detail && requestedEnrolledView && !detail.isEnrolled) {
      navigate(location.pathname, { replace: true });
    }
  }, [requestedEnrolledView, detail, loadingDetail, navigate, location.pathname]);

  const courseIds = useMemo(() => (detail && detail.steps ? detail.steps.map(step => step.courseKey) : []), [detail]);

  const {
    data: coursesForPath,
    isLoading: loadingCourses,
    error: coursesError,
  } = useCoursesByIds(courseIds);

  const enrollMutation = useEnrollLearningPath();

  const accessUntilDate = useMemo(() => {
    if (!coursesForPath) {
      return null;
    }

    let maxDate = null;
    for (const c of coursesForPath) {
      if (c.endDate) {
        const endDateObj = new Date(c.endDate);
        if (!maxDate || endDateObj > maxDate) {
          maxDate = endDateObj;
        }
      }
    }
    return maxDate;
  }, [coursesForPath]);

  // In the details view, open the course details modal.
  const handleCourseViewButton = (courseId, pathTitle) => {
    setSelectedCourseKey(courseId);
    setSelectedPathTitle(pathTitle);
  };

  const handleCloseCourseModal = () => {
    setSelectedCourseKey(null);
    setSelectedPathTitle('');
  };

  const handleViewClick = () => {
    // Navigate to the enrolled view.
    navigate(`${location.pathname}?view=enrolled`);
  };

  const handleEnrollClick = async () => {
    if (detail && !detail.isEnrolled) {
      setEnrolling(true);
      try {
        await enrollMutation.mutateAsync(key);
        navigate(`${location.pathname}?view=enrolled`);
      } catch (error) {
        // eslint-disable-next-line no-console
        console.error('Enrollment failed:', error);
      } finally {
        setEnrolling(false);
      }
    } else {
      // Already enrolled.
      navigate(`${location.pathname}?view=enrolled`);
    }
  };

  let content;
  if (loadingDetail || loadingCourses) {
    content = (
      <div className="d-flex justify-content-center align-items-center vh-100">
        <Spinner animation="border" variant="primary" />
      </div>
    );
  } else if (detailError || !detail) {
    content = (
      <div className="p-4">
        <p>Failed to load detail</p>
        <Link to="/">
          <Icon src={ChevronLeft} />
          <span>Go Back</span>
        </Link>
      </div>
    );
  } else {
    const {
      displayName,
      image,
      subtitle,
      durationInDays,
      requiredSkills,
      description,
      isEnrolled,
    } = detail;

    const durationText = durationInDays ? `${durationInDays} days` : null;
    const handleTabSelect = (selectedKey) => {
      const el = document.getElementById(selectedKey);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth' });
      }
    };

    // Hero section - same for both full view and enrolled view.
    const heroSection = (
      <div className="hero-section p-4">
        <div className="mb-5">
          <Link to="/" className="d-flex align-items-center back-link">
            <Icon src={ChevronLeft} />
            <span>Go Back</span>
          </Link>
        </div>
        <Row className="border-bottom border-light hero-content">
          <Col xs={12} md={8}>
            <div className="lp-detail-type-label d-flex text-uppercase mb-2">
              <Icon src={FormatListBulleted} className="mr-1" />
              <span>Learning Path</span>
            </div>
            <h1 className="mb-3">{displayName}</h1>
            {subtitle && (
              <p className="text-muted mb-4" style={{ maxWidth: '80%' }}>
                  {subtitle}
              </p>
            )}
          </Col>
          <Col xs={12} md={4} className="d-flex align-items-center justify-content-center hero-image">
            {image && (<img src={image} alt={displayName} />)}
          </Col>
        </Row>
        <Row className="mt-4 d-flex hero-info-row">
          {accessUntilDate && (
            <Col xs={6} md={3} className="mb-3">
              <div className="d-flex align-items-center">
                <Icon src={AccessTimeFilled} className="mr-4 mb-3" />
                <div>
                  <p className="mb-0 font-weight-bold">
                    {accessUntilDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                  </p>
                  <p className="text-muted mb-0 info-subtext">Access ends</p>
                </div>
              </div>
            </Col>
          )}
          <Col xs={6} md={3} className="mb-3">
            <div className="d-flex align-items-center">
              <Icon src={Award} className="mr-4 mb-4" />
              <div>
                <p className="mb-1 font-weight-bold">Certificate</p>
                <p className="text-muted info-subtext">Earn a certificate</p>
              </div>
            </div>
          </Col>
          <Col xs={6} md={3} className="mb-3">
            <div className="d-flex align-items-center">
              <Icon src={Calendar} className="mr-4 mb-4" />
              <div>
                <p className="mb-1 font-weight-bold">
                  {durationText || 'Duration not available'}
                </p>
                <p className="text-muted info-subtext">Duration</p>
              </div>
            </div>
          </Col>
          <Col xs={6} md={3} className="mb-3">
            <div className="d-flex align-items-center">
              <Icon src={Person} className="mr-4 mb-4" />
              <div>
                <p className="mb-1 font-weight-bold">Self-paced</p>
                <p className="text-muted info-subtext">Progress at your own speed</p>
              </div>
            </div>
          </Col>
        </Row>
      </div>
    );

    if (isEnrolledView) {
      // Enrolled view - keep the hero section, then only show courses.
      content = (
        <div className="learning-path-detail-page">
          {heroSection}

          <div className="p-4">
            {!loadingCourses && !coursesError && (!coursesForPath || coursesForPath.length === 0) && (
              <p>No sub-courses found in this learning path.</p>
            )}
            {!loadingCourses && !coursesError && coursesForPath && coursesForPath.length > 0 && (
              coursesForPath.map(course => (
                <div key={course.id} className="mb-3">
                  <CourseCardWithEnrollment
                    course={course}
                    learningPathId={key}
                  />
                </div>
              ))
            )}
          </div>
        </div>
      );
    } else {
      // Details view with all sections.
      content = (
        <div className="detail-page learning-path-detail-page">
          {heroSection}
          <div className="lp-tabs d-flex align-items-center px-4">
            <Nav
              variant="tabs"
              onSelect={handleTabSelect}
              className="border-bottom-0"
            >
              <Nav.Item>
                <Nav.Link eventKey="about">About</Nav.Link>
              </Nav.Item>
              <Nav.Item>
                <Nav.Link eventKey="courses">Courses</Nav.Link>
              </Nav.Item>
              <Nav.Item>
                <Nav.Link eventKey="requirements">Requirements</Nav.Link>
              </Nav.Item>
            </Nav>
            <Button
              variant="primary"
              className="ml-auto"
              onClick={isEnrolled ? handleViewClick : handleEnrollClick}
              disabled={enrolling}
            >
              {(() => {
                if (enrolling) { return 'Enrolling...'; }
                if (isEnrolled) { return 'View'; }
                return 'Enroll';
              })()}
            </Button>
          </div>
          <div className="p-4 mt-3 ml-2 mr-2 lp-info">
            <section id="about" className="mb-6">
              <h2>About</h2>
              <p>
                {/* eslint-disable-next-line react/no-danger */}
                <div dangerouslySetInnerHTML={{ __html: description || 'No description available.' }} />
              </p>
            </section>
            <section id="courses" className="mb-6 courses-section">
              <h2>Courses</h2>
              {!loadingCourses && !coursesError && (!coursesForPath || coursesForPath.length === 0) && (
                <p>No sub-courses found in this learning path.</p>
              )}
              {!loadingCourses && !coursesError && coursesForPath && coursesForPath.length > 0 && (
                coursesForPath.map(course => (
                  <div key={course.id} className="mb-3">
                    <CourseCard
                      course={course}
                      parentPath=""
                      onClick={handleCourseViewButton}
                    />
                  </div>
                ))
              )}
            </section>
            <section id="requirements" className="mb-6">
              <h2>Requirements</h2>
              {requiredSkills && requiredSkills.map((skillObj) => (
                <p key={`requirement-${skillObj.skill.displayName.replace(/\s+/g, '-').substring(0, 40)}`}>
                  {skillObj.skill.displayName}
                </p>
              ))}
            </section>
          </div>
        </div>
      );
    }
  }

  return (
    <>
      {content}

      {selectedCourseKey && (
        <ModalLayer
          isOpen
          onClose={handleCloseCourseModal}
          className="lp-course-modal-layer"
        >
          <CourseDetailPage
            isModalView
            courseKey={selectedCourseKey}
            onClose={handleCloseCourseModal}
            learningPathTitle={selectedPathTitle}
          />
        </ModalLayer>
      )}
    </>
  );
};

export default LearningPathDetailPage;
