import React, { useMemo, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  Row, Col, Spinner, Nav, Icon, ModalLayer,
} from '@openedx/paragon';
import {
  Person,
  Award,
  Calendar,
  FormatListBulleted,
  AccessTimeFilled,
} from '@openedx/paragon/icons';
import { buildAssetUrl } from '../util/assetUrl';
import { useLearningPathDetail, useCoursesByIds } from './data/queries';
import CourseCard from './CourseCard';
import CourseDetailPage from './CourseDetails';

const LearningPathDetailPage = () => {
  const { key } = useParams();
  const [selectedCourseKey, setSelectedCourseKey] = useState(null);

  const {
    data: detail,
    isLoading: loadingDetail,
    error: detailError,
  } = useLearningPathDetail(key);

  const courseIds = useMemo(() => (detail && detail.steps ? detail.steps.map(step => step.courseKey) : []), [detail]);

  const {
    data: coursesForPath,
    isLoading: loadingCourses,
    error: coursesError,
  } = useCoursesByIds(courseIds);

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

  const handleOpenCourseModal = (courseKey) => {
    setSelectedCourseKey(courseKey);
  };

  const handleCloseCourseModal = () => {
    setSelectedCourseKey(null);
  };

  let content;
  if (loadingDetail || loadingCourses) {
    content = <Spinner animation="border" variant="primary" />;
  } else if (detailError || !detail) {
    content = (
      <div className="p-4">
        <p>Failed to load detail</p>
        <Link to="/">Explore</Link>
      </div>
    );
  } else {
    const {
      displayName,
      imageUrl,
      subtitle,
      durationInDays,
      requiredSkills,
      description,
    } = detail;

    const durationText = durationInDays ? `${durationInDays} days` : null;
    const handleTabSelect = (selectedKey) => {
      const el = document.getElementById(selectedKey);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth' });
      }
    };
    content = (
      <div className="learning-path-detail-page">
        <div className="hero-section p-4">
          <div className="mb-3">
            <Link to="/" style={{ fontWeight: 600 }}>
              Explore
            </Link>
          </div>
          <Row>
            <Col xs={12} md={8}>
              <div className="lp-type-label text-uppercase mb-2">
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
            <Col xs={12} md={4} className="d-flex align-items-center justify-content-center">
              {imageUrl && (
              <img
                src={buildAssetUrl(imageUrl)}
                alt={displayName}
                style={{
                  width: '100%', borderRadius: '4px', maxHeight: '250px', objectFit: 'cover',
                }}
              />
              )}
            </Col>
          </Row>
          <Row className="mt-4">
            {accessUntilDate && (
              <Col xs={6} md={3} className="mb-3">
                <div className="d-flex align-items-center">
                  <Icon src={AccessTimeFilled} className="mr-4 mb-3" />
                  <div>
                    <p className="mb-0 font-weight-bold">
                      {accessUntilDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </p>
                    <p className="text-muted mb-0">Access ends</p>
                  </div>
                </div>
              </Col>
            )}
            <Col xs={6} md={3} className="mb-3">
              <div className="d-flex align-items-center">
                <Icon src={Award} className="mr-4 mb-4" />
                <div>
                  <p className="mb-1 font-weight-bold">Earn a certificate</p>
                  <p className="text-muted">Some subtext</p>
                </div>
              </div>
            </Col>
            <Col xs={6} md={3} className="mb-3">
              <div className="d-flex align-items-center">
                <Icon src={Calendar} className="mr-4 mb-4" />
                <div>
                  <p className="mb-1 font-weight-bold">
                    {durationText || '6 months'}
                  </p>
                  <p className="text-muted">Duration</p>
                </div>
              </div>
            </Col>
            <Col xs={6} md={3} className="mb-3">
              <div className="d-flex align-items-center">
                <Icon src={Person} className="mr-4 mb-4" />
                <div>
                  <p className="mb-1 font-weight-bold">Self-paced</p>
                  <p className="text-muted">Some subtext</p>
                </div>
              </div>
            </Col>
          </Row>
        </div>
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
        </div>
        <div className="p-4 lp-info">
          <section id="about" className="mb-6">
            <h2>About</h2>
            <p>
              {description || ''}
            </p>
          </section>
          <section id="courses" className="mb-6">
            <h2>Courses</h2>
            {loadingCourses && <Spinner animation="border" variant="primary" />}
            {!loadingCourses && !coursesError && (!coursesForPath || coursesForPath.length === 0) && (
              <p>No sub-courses found in this learning path.</p>
            )}
            {!loadingCourses && !coursesError && coursesForPath && coursesForPath.length > 0 && (
              coursesForPath.map(course => (
                <div key={course.courseId} className="mb-3">
                  <CourseCard
                    course={course}
                    parentPath=""
                    onClick={() => handleOpenCourseModal(course.courseId ? `course-v1:${course.org}+${course.courseId}+${course.run}` : null)}
                  />
                </div>
              ))
            )}
          </section>
          <section id="requirements" className="mb-6">
            <h2>Requirements</h2>
            {requiredSkills && requiredSkills.map((skill) => (
              <p key={`requirement-${skill.replace(/\s+/g, '-').substring(0, 40)}`}>
                {skill}
              </p>
            ))}
          </section>
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
          />
        </ModalLayer>
      )}
    </>
  );
};

export default LearningPathDetailPage;
