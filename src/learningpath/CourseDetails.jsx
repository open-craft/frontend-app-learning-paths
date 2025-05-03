import React from 'react';
import PropTypes from 'prop-types';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  Spinner,
  Card,
  Row,
  Col,
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
  ChevronLeft,
} from '@openedx/paragon/icons';
import { useCourseDetail } from './data/queries';
import { buildAssetUrl, replaceStaticAssetReferences } from '../util/assetUrl';
import { buildCourseHomeUrl } from './utils';

const CourseDetailContent = ({
  course,
  isModalView = false,
  onClose,
  learningPathTitle,
}) => {
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

  const navigate = useNavigate();
  const handleClose = onClose || (() => navigate(-1));
  const { courseKey: urlCourseKey } = useParams();
  const activeCourseKey = course.id || urlCourseKey;
  const handleViewClick = () => {
    window.location.href = buildCourseHomeUrl(activeCourseKey);
  };

  return (
    <>
      <div className="hero-section p-4">
        {!isModalView && (
          <div className="mb-3">
            <Link to="/" className="d-flex font-weight-bold">
              <Icon src={ChevronLeft} />
              <span>Go Back</span>
            </Link>
          </div>
        )}
        {isModalView && (
          <div className="lp-course-modal-header d-flex align-items-center justify-content-between py-2">
            {learningPathTitle && (
              <h5 className="mb-0">
                Learning Path: {learningPathTitle}
              </h5>
            )}
            <div className="pgn__modal-close-container">
              <ModalCloseButton variant="tertiary" onClick={handleClose}>
                <Icon src={Close} />
              </ModalCloseButton>
            </div>
          </div>
        )}
        <Row className="border-bottom border-light">
          <Col xs={12} md={8}>
            <div className="course-detail-type-label d-flex text-uppercase mb-2">
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
              className="course-detail-image"
            />
            )}
          </Col>
        </Row>
        <Row className="mt-4 hero-info-row">
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
          <Col xs={6} md={3} className="mb-3">
            <div className="d-flex align-items-center">
              <Icon src={Person} className="mr-4 mb-4" />
              <div>
                <p className="mb-1 font-weight-bold">{selfPaced ? 'Self-paced' : 'Instructor-paced'}</p>
                <p className="text-muted">
                  {selfPaced ? 'Progress at your own speed' : 'Follow the course schedule'}
                </p>
              </div>
            </div>
          </Col>
        </Row>
      </div>

      {!isModalView && (
        <div className="lp-tabs d-flex align-items-center px-4 pt-2 pb-2">
          <Button
            variant="primary"
            className="ml-auto"
            onClick={handleViewClick}
          >
            View
          </Button>
        </div>
      )}

      <div className="p-4">
        <section id="about" className="mb-6">
          {/* eslint-disable-next-line react/no-danger */}
          <div dangerouslySetInnerHTML={{
            __html: replaceStaticAssetReferences(description || shortDescription || 'No description available.', course.id),
          }}
          />
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
  learningPathTitle: PropTypes.string,
};

const CourseDetailPage = ({
  isModalView = false,
  onClose,
  courseKey: propCourseKey,
  learningPathTitle,
}) => {
  const { courseKey: urlCourseKey } = useParams();
  const courseKey = propCourseKey || urlCourseKey;

  const {
    data: course,
    isLoading,
    error,
  } = useCourseDetail(courseKey);

  if (isLoading) {
    return (
      <div className="d-flex justify-content-center align-items-center vh-100">
        <Spinner animation="border" variant="primary" />
      </div>
    );
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
  };

  return (
    <div className="detail-page course-detail-page">
      <CourseDetailContent
        course={courseWithFallbacks}
        isModalView={isModalView}
        onClose={onClose}
        learningPathTitle={learningPathTitle}
      />
    </div>
  );
};

CourseDetailPage.propTypes = {
  isModalView: PropTypes.bool,
  onClose: PropTypes.func,
  courseKey: PropTypes.string,
  learningPathTitle: PropTypes.string,
};

export default CourseDetailPage;
