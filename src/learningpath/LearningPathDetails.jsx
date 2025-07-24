import React, { useMemo, useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  Row, Spinner, Nav, Icon, ModalLayer, Button, Chip, Card, Collapsible,
} from '@openedx/paragon';
import {
  Person,
  Award,
  Calendar,
  FormatListBulleted,
  AccessTimeFilled,
  ChevronLeft,
} from '@openedx/paragon/icons';
import {
  useLearningPathDetail, useCoursesByIds, useEnrollLearningPath, useOrganizations,
} from './data/queries';
import { CourseCardWithEnrollment } from './CourseCard';
import CourseDetailPage from './CourseDetails';
import { useScreenSize } from '../hooks/useScreenSize';

const LearningPathDetailPage = () => {
  const { isSmall } = useScreenSize();
  const { key } = useParams();
  const [selectedCourseKey, setSelectedCourseKey] = useState(null);
  const [enrolling, setEnrolling] = useState(false);
  const [openCollapsible, setOpenCollapsible] = useState(null);

  const [activeTab, setActiveTab] = useState(null);
  const handleTabSelect = (selectedKey) => {
    setActiveTab(selectedKey);
  };

  const handleCollapsibleToggle = (collapsibleId) => {
    setOpenCollapsible(openCollapsible === collapsibleId ? null : collapsibleId);
  };

  // Scroll to the top when the component mounts.
  useEffect(() => {
    // Add a timeout to ensure DOM updates are complete.
    const id = setTimeout(() => window.scrollTo({ top: 0, behavior: 'instant' }), 10);
    return () => clearTimeout(id);
  }, []);

  const {
    data: detail,
    isLoading: loadingDetail,
    error: detailError,
  } = useLearningPathDetail(key);

  useEffect(() => {
    if (detail && activeTab === null) {
      setActiveTab(detail.enrollmentDate ? 'courses' : 'about');
    }
  }, [detail, activeTab]);

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
  const handleCourseViewButton = (courseId) => {
    setTimeout(() => window.scrollTo({ top: 0, behavior: 'smooth' }), 10);
    setSelectedCourseKey(courseId);
  };

  const handleCloseCourseModal = () => {
    setSelectedCourseKey(null);
  };

  const handleEnrollClick = async () => {
    if (detail && !detail.enrollmentDate) {
      setEnrolling(true);
      try {
        await enrollMutation.mutateAsync(key);
      } catch (error) {
        // eslint-disable-next-line no-console
        console.error('Enrollment failed:', error);
      } finally {
        setActiveTab('courses');
        setEnrolling(false);
      }
    }
  };

  // TODO: Retrieve this from the backend.
  const org = key.match(/path-v1:([^+]+)/)[1];
  const { data: organizations = {} } = useOrganizations();
  const orgData = useMemo(() => ({
    name: organizations[org]?.name || org,
    logo: organizations[org]?.logo,
  }), [organizations, org]);

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
      duration,
      timeCommitment,
      requiredSkills,
      description,
      enrollmentDate,
    } = detail;

    // Hero section - same for both full view and enrolled view.
    const heroSection = (
      <div className="hero">
        <Card orientation={isSmall ? 'vertical' : 'horizontal'} className={isSmall ? 'border-0' : ''}>
          <Card.Body>
            <Card.Section className="px-2 py-3">
              <Link to="/" className="d-flex align-items-center back-link pl-md-3">
                <Icon src={ChevronLeft} />
                <span>Go Back</span>
              </Link>
            </Card.Section>
            {isSmall && (
              <Card.ImageCap
                src={image}
                srcAlt={`${displayName} learning path image`}
                logoSrc={orgData.logo}
                logoAlt={`${orgData.name} logo`}
                className="mb-4"
              />
            )}
            <Card.Section className="px-4 py-4 py-md-3.5">
              <Chip iconBefore={FormatListBulleted} className="lp-chip">LEARNING PATH</Chip>
              <h1 className="my-3 mt-4.5">{displayName}</h1>
              {/* eslint-disable-next-line react/no-danger */}
              <div className="text-muted" dangerouslySetInnerHTML={{ __html: subtitle || 'No subtitle available.' }} />
            </Card.Section>
          </Card.Body>
          {!isSmall && (
            <Card.ImageCap
              src={image}
              srcAlt={`${displayName} learning path image`}
              logoSrc={orgData.logo}
              logoAlt={`${orgData.name} logo`}
            />
          )}
        </Card>
        {isSmall && (
          <div className="mx-4">
            <Button
              variant={enrollmentDate ? 'secondary' : 'primary'}
              className="px-3 w-100"
              onClick={handleEnrollClick}
              disabled={enrolling || !!enrollmentDate}
            >
              {(() => {
                if (enrolling) { return 'Enrolling...'; }
                if (enrollmentDate) { return 'Enrolled'; }
                return 'Enroll';
              })()}
            </Button>
          </div>
        )}
        <Row className="my-4 mx-0 px-4 px-md-6 flex-column flex-md-row align-items-start hero-info lp-hero-info">
          {accessUntilDate && (
            <div className="d-flex">
              <Icon src={AccessTimeFilled} className="mr-4 mb-3.5" />
              <div>
                <p className="mb-0 font-weight-bold">
                  {accessUntilDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                </p>
                <p className="mb-0 text-muted">Access ends</p>
              </div>
            </div>
          )}
          <div className="d-flex">
            <Icon src={Award} className="mr-4 mb-3.5" />
            <div>
              <p className="mb-0 font-weight-bold">Certificate</p>
              <p className="mb-0 text-muted">Courses include certification</p>
            </div>
          </div>
          <div className="d-flex">
            <Icon src={Calendar} className="mr-4 mb-3.5" />
            <div>
              <p className="mb-0 font-weight-bold">
                {duration || 'Duration not available'}
              </p>
              <p className="mb-0 text-muted">{timeCommitment || 'Duration'}</p>
            </div>
          </div>
          <div className="d-flex">
            <Icon src={Person} className="mr-4 mb-3.5" />
            <div>
              <p className="mb-0 font-weight-bold">Self-paced</p>
              <p className="mb-0 text-muted">Progress at your own speed</p>
            </div>
          </div>
        </Row>
      </div>
    );

    content = (
      <div className="detail-page learning-path-detail-page">
        {heroSection}
        {!isSmall && (
          <div className="tabs d-flex align-items-center pl-5.5 pr-0">
            <Nav
              variant="tabs"
              onSelect={handleTabSelect}
              className="border-bottom-0"
              activeKey={activeTab}
            >
              <Nav.Item>
                <Nav.Link eventKey="about" className="font-weight-normal">About</Nav.Link>
              </Nav.Item>
              <Nav.Item>
                <Nav.Link eventKey="courses" className="font-weight-normal">Courses</Nav.Link>
              </Nav.Item>
              {requiredSkills && requiredSkills.length > 0 && (
                <Nav.Item>
                  <Nav.Link eventKey="requirements" className="font-weight-normal">Requirements</Nav.Link>
                </Nav.Item>
              )}
            </Nav>
            <Button
              variant={enrollmentDate ? 'secondary' : 'primary'}
              className="ml-auto rounded-0 px-5.5 align-self-stretch"
              onClick={handleEnrollClick}
              disabled={enrolling || !!enrollmentDate}
            >
              {(() => {
                if (enrolling) { return 'Enrolling...'; }
                if (enrollmentDate) { return 'Enrolled'; }
                return 'Enroll';
              })()}
            </Button>
          </div>
        )}
        <div className="py-3 lp-info">
          {isSmall ? (
            <div className="mobile-content px-3">
              <Collapsible
                title="About"
                open={openCollapsible === 'about'}
                onToggle={() => handleCollapsibleToggle('about')}
                className="mb-2"
              >
                <section id="about">
                  {/* eslint-disable-next-line react/no-danger */}
                  <div dangerouslySetInnerHTML={{ __html: description || 'No description available.' }} />
                </section>
              </Collapsible>

              <Collapsible
                title="Courses"
                open={openCollapsible === 'courses'}
                onToggle={() => handleCollapsibleToggle('courses')}
                className="mb-2"
              >
                <section id="courses">
                  {!loadingCourses && !coursesError && (!coursesForPath || coursesForPath.length === 0) && (
                    <p>No sub-courses found in this learning path.</p>
                  )}
                  {!loadingCourses && !coursesError && coursesForPath && coursesForPath.length > 0 && (
                    coursesForPath.map(course => (
                      <div key={course.id} className="mb-3">
                        <CourseCardWithEnrollment
                          course={course}
                          learningPathId={key}
                          enrollmentDateInLearningPath={enrollmentDate}
                          onClick={() => handleCourseViewButton(course.id)}
                        />
                      </div>
                    ))
                  )}
                </section>
              </Collapsible>

              {requiredSkills && requiredSkills.length > 0 && (
                <Collapsible
                  title="Requirements"
                  open={openCollapsible === 'requirements'}
                  onToggle={() => handleCollapsibleToggle('requirements')}
                  className="mb-2"
                >
                  <section id="requirements">
                    {requiredSkills.map((skillObj) => (
                      <p key={`requirement-${skillObj.skill.displayName.replace(/\s+/g, '-').substring(0, 40)}`}>
                        {skillObj.skill.displayName}
                      </p>
                    ))}
                  </section>
                </Collapsible>
              )}
            </div>
          ) : (
            <div className="desktop-content">
              {activeTab === 'about' && (
                <section id="about">
                  <h2>About</h2>
                  {/* eslint-disable-next-line react/no-danger */}
                  <div dangerouslySetInnerHTML={{ __html: description || 'No description available.' }} />
                </section>
              )}
              {activeTab === 'courses' && (
                <div id="courses-section-wrapper">
                  <section id="courses" className="mx-auto">
                    <h2>Courses</h2>
                    {!loadingCourses && !coursesError && (!coursesForPath || coursesForPath.length === 0) && (
                      <p>No sub-courses found in this learning path.</p>
                    )}
                    {!loadingCourses && !coursesError && coursesForPath && coursesForPath.length > 0 && (
                      coursesForPath.map(course => (
                        <div key={course.id} className="mb-3">
                          <CourseCardWithEnrollment
                            course={course}
                            learningPathId={key}
                            enrollmentDateInLearningPath={enrollmentDate}
                            onClick={() => handleCourseViewButton(course.id)}
                          />
                        </div>
                      ))
                    )}
                  </section>
                </div>
              )}
              {activeTab === 'requirements' && (
                <section id="requirements">
                  <h2>Requirements</h2>
                  {requiredSkills.map((skillObj) => (
                    <p key={`requirement-${skillObj.skill.displayName.replace(/\s+/g, '-').substring(0, 40)}`}>
                      {skillObj.skill.displayName}
                    </p>
                  ))}
                </section>
              )}
            </div>
          )}
        </div>
      </div>
    );
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
            learningPathTitle={detail?.displayName}
          />
        </ModalLayer>
      )}
    </>
  );
};

export default LearningPathDetailPage;
