import React, { useMemo, useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  Row, Spinner, Nav, Icon, ModalLayer, Button, Chip, Card,
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

const LearningPathDetailPage = () => {
  const { key } = useParams();
  const [selectedCourseKey, setSelectedCourseKey] = useState(null);
  const [enrolling, setEnrolling] = useState(false);

  const [activeTab, setActiveTab] = useState(null);
  const handleTabSelect = (selectedKey) => {
    setActiveTab(selectedKey);
  };

  const {
    data: detail,
    isLoading: loadingDetail,
    error: detailError,
  } = useLearningPathDetail(key);

  useEffect(() => {
    if (detail && activeTab === null) {
      setActiveTab(detail.isEnrolled ? 'courses' : 'about');
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
    if (detail && !detail.isEnrolled) {
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
      durationInDays,
      requiredSkills,
      description,
      isEnrolled,
    } = detail;

    const durationText = durationInDays ? `${durationInDays} days` : null;

    // Hero section - same for both full view and enrolled view.
    const heroSection = (
      <div className="hero">
        <Card orientation="horizontal">
          <Card.Body>
            <Card.Section>
              <Link to="/" className="d-flex align-items-center back-link pl-4">
                <Icon src={ChevronLeft} />
                <span>Go Back</span>
              </Link>
            </Card.Section>
            <Card.Section className="pl-5 pr-6">
              <Chip iconBefore={FormatListBulleted} className="lp-chip">LEARNING PATH</Chip>
              <h1 className="my-3 mt-4.5">{displayName}</h1>
              <p className="text-muted">{subtitle}</p>
            </Card.Section>
          </Card.Body>
          <Card.ImageCap src={image} logoSrc={orgData.logo} />
        </Card>
        <Row className="mt-4 mx-0 px-6 d-flex hero-info lp-hero-info">
          {accessUntilDate && (
            <div className="d-flex">
              <Icon src={AccessTimeFilled} className="mr-4 mb-3" />
              <div>
                <p className="mb-0 font-weight-bold">
                  {accessUntilDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                </p>
                <p className="mb-2 text-muted info-subtext">Access ends</p>
              </div>
            </div>
          )}
          <div className="d-flex">
            <Icon src={Award} className="mr-4 mb-4" />
            <div>
              <p className="mb-0 font-weight-bold">Certificate</p>
              <p className="mb-2 text-muted info-subtext">Earn a certificate</p>
            </div>
          </div>
          <div className="d-flex">
            <Icon src={Calendar} className="mr-4 mb-4" />
            <div>
              <p className="mb-0 font-weight-bold">
                {durationText || 'Duration not available'}
              </p>
              <p className="mb-2 text-muted info-subtext">Duration</p>
            </div>
          </div>
          <div className="d-flex">
            <Icon src={Person} className="mr-4 mb-4" />
            <div>
              <p className="mb-0 font-weight-bold">Self-paced</p>
              <p className="mb-2 text-muted info-subtext">Progress at your own speed</p>
            </div>
          </div>
        </Row>
      </div>
    );

    content = (
      <div className="detail-page learning-path-detail-page">
        {heroSection}
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
            variant={isEnrolled ? 'secondary' : 'primary'}
            className="ml-auto rounded-0 py-3 px-5.5"
            onClick={handleEnrollClick}
            disabled={enrolling || isEnrolled}
          >
            {(() => {
              if (enrolling) { return 'Enrolling...'; }
              if (isEnrolled) { return 'Enrolled'; }
              return 'Enroll';
            })()}
          </Button>
        </div>
        <div className="py-3 lp-info">
          {activeTab === 'about' && (
            <section id="about">
              <h2>About</h2>
              <p>
                {/* eslint-disable-next-line react/no-danger */}
                <div dangerouslySetInnerHTML={{ __html: description || 'No description available.' }} />
              </p>
            </section>
          )}
          {activeTab === 'courses' && (
            <div id="courses-section-wrapper">
              <section id="courses">
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
                        isEnrolledInLearningPath={isEnrolled}
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
