import React from 'react';
import PropTypes from 'prop-types';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { getConfig } from '@edx/frontend-platform';
import {
  Spinner,
  Card,
  Row,
  Col,
  Nav,
  Icon,
  ModalCloseButton,
  Button,
  Alert,
} from '@openedx/paragon';
import {
  LmsBook,
  AccessTimeFilled,
  Award,
  Calendar,
  Person,
  Close,
} from '@openedx/paragon/icons';
import { useCourseDetail } from './data/queries';
import { buildAssetUrl } from '../util/assetUrl';

const CourseDetailContent = ({ course, isModalView, onClose }) => {
  const {
    name,
    shortDescription,
    endDate,
    duration,
    selfPaced,
    courseImageAssetPath,
    description,
  } = course;

  const dateDisplay = endDate
    ? new Date(endDate).toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    })
    : null;

  const handleTabSelect = (selectedKey) => {
    const el = document.getElementById(selectedKey);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };
  const navigate = useNavigate();
  const handleClose = onClose || (() => navigate(-1));
  const { courseKey: urlCourseKey } = useParams();
  const activeCourseKey = course.id || urlCourseKey;
  const learningMfeBase = getConfig().LEARNING_BASE_URL;
  const buildCourseHomeUrl = (key) => `${learningMfeBase}/learning/course/${key}/home`;
  const handleViewClick = () => {
    window.location.href = buildCourseHomeUrl(activeCourseKey);
  };

  return (
    <>
      <div className="hero-section p-4">
        {!isModalView && (
          <div className="mb-3">
            <Link to="/" style={{ fontWeight: 600 }}>Explore</Link>
          </div>
        )}
        {isModalView && (
          <div className="pgn__modal-close-container">
            <ModalCloseButton variant="tertiary" onClick={handleClose}>
              <Icon src={Close} />
            </ModalCloseButton>
          </div>
        )}
        <Row>
          <Col xs={12} md={8}>
            <div className="course-type-label text-uppercase mb-2">
              <Icon src={LmsBook} className="mr-1" />
              <span>Course</span>
            </div>
            <h1 className="mb-2">{name}</h1>
            {shortDescription && (
              <p className="text-muted mb-4">{shortDescription}</p>
            )}
          </Col>
          <Col xs={12} md={4}>
            {courseImageAssetPath && (
            <Card.ImageCap
              src={buildAssetUrl(courseImageAssetPath)}
              alt={name}
              className="course-card-image"
            />
            )}
          </Col>
        </Row>
        <Row className="mt-4">
          {dateDisplay && (
            <Col xs={6} md={3} className="mb-3">
              <div className="d-flex align-items-center">
                <Icon src={AccessTimeFilled} className="mr-4 mb-3" />
                <div>
                  <p className="mb-1 font-weight-bold">{dateDisplay}</p>
                  <p className="text-muted">Access ends</p>
                </div>
              </div>
            </Col>
          )}
          <Col xs={6} md={3} className="mb-3">
            <div className="d-flex align-items-center">
              <Icon src={Award} className="mr-4 mb-4" />
              <div>
                <p className="mb-1 font-weight-bold">Earn a certificate</p>
                <p className="text-muted">Courses include certification</p>
              </div>
            </div>
          </Col>
          {duration && (
            <Col xs={6} md={3} className="mb-3">
              <div className="d-flex align-items-center">
                <Icon src={Calendar} className="mr-4 mb-4" />
                <div>
                  <p className="mb-1 font-weight-bold">{duration}</p>
                  <p className="text-muted">Approx. duration</p>
                </div>
              </div>
            </Col>
          )}
          {selfPaced === true && (
            <Col xs={6} md={3} className="mb-3">
              <div className="d-flex align-items-center">
                <Icon src={Person} className="mr-4 mb-4" />
                <div>
                  <p className="mb-1 font-weight-bold">Self-paced</p>
                  <p className="text-muted">Learn at your own speed</p>
                </div>
              </div>
            </Col>
          )}
        </Row>
      </div>

      <div className="lp-tabs d-flex align-items-center px-4">
        <Nav variant="tabs" onSelect={handleTabSelect} className="border-bottom-0">
          <Nav.Item>
            <Nav.Link eventKey="about">About</Nav.Link>
          </Nav.Item>
        </Nav>
        <Button
          variant="primary"
          className="ml-auto"
          onClick={handleViewClick}
        >
          View
        </Button>
      </div>

      <div className="p-4">
        <section id="about" className="mb-6">
          {/* eslint-disable-next-line react/no-danger */}
          <div dangerouslySetInnerHTML={{ __html: description || shortDescription || 'No description available.' }} />
        </section>
      </div>
    </>
  );
};

CourseDetailContent.propTypes = {
  course: PropTypes.shape({
    id: PropTypes.string,
    name: PropTypes.string.isRequired,
    shortDescription: PropTypes.string,
    endDate: PropTypes.string,
    duration: PropTypes.string,
    selfPaced: PropTypes.bool,
    courseImageAssetPath: PropTypes.string,
    description: PropTypes.string,
  }).isRequired,
  isModalView: PropTypes.bool,
  onClose: PropTypes.func,
};

CourseDetailContent.defaultProps = {
  isModalView: false,
  onClose: undefined,
};

const CourseDetailPage = ({ isModalView = false, onClose, courseKey: propCourseKey }) => {
  const { courseKey: urlCourseKey } = useParams();
  const courseKey = propCourseKey || urlCourseKey;

  const {
    data: course,
    isLoading,
    error,
  } = useCourseDetail(courseKey);

  if (isLoading) {
    return <Spinner animation="border" variant="primary" />;
  }

  if (error) {
    return (
      <Alert variant="danger">
        <Alert.Heading>Error loading course</Alert.Heading>
        <p>{error.message}</p>
        <Link to="/">Return to dashboard</Link>
      </Alert>
    );
  }

  if (!course) {
    return (
      <Alert variant="info">
        <Alert.Heading>Course not found</Alert.Heading>
        <p>We couldn&apos;t find the requested course.</p>
        <Link to="/">Return to dashboard</Link>
      </Alert>
    );
  }

  const courseWithFallbacks = {
    ...course,
    shortDescription: course.shortDescription || '',
    description: course.description || course.shortDescription || '',
    duration: course.duration || '',
    selfPaced: course.selfPaced !== undefined ? course.selfPaced : true,
  };

  return (
    <div className="course-detail-page">
      <CourseDetailContent course={courseWithFallbacks} isModalView={isModalView} onClose={onClose} />
    </div>
  );
};

CourseDetailPage.propTypes = {
  isModalView: PropTypes.bool,
  onClose: PropTypes.func,
  courseKey: PropTypes.string,
};

CourseDetailPage.defaultProps = {
  isModalView: false,
  onClose: undefined,
  courseKey: undefined,
};

export default CourseDetailPage;
