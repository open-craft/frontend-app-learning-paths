import React, { useMemo } from 'react';
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
  Chip,
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
import { useCourseDetail, useOrganizations } from './data/queries';
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
    org,
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

  const { data: organizations = {} } = useOrganizations();
  const orgData = useMemo(() => ({
    name: organizations[org]?.name || org,
    logo: organizations[org]?.logo,
  }), [organizations, org]);

  return (
    <>
      <div className="hero">
        {isModalView && (
          <Row className="p-0 m-0 d-flex align-items-center modal-header">
            <Col>
              <h4 className="mb-0 pl-4 text-muted font-weight-normal">
                <b>Learning Path:</b> {learningPathTitle}
              </h4>
            </Col>
            <ModalCloseButton variant="tertiary" onClick={handleClose} className="mr-1">
              <Icon src={Close} />
            </ModalCloseButton>
          </Row>
        )}
        <Card orientation="horizontal">
          <Card.Body>
            {!isModalView && (
            <Card.Section>
              <Link to="/" className="d-flex align-items-center back-link pl-4">
                <Icon src={ChevronLeft} />
                <span>Go Back</span>
              </Link>
            </Card.Section>
            )}
            <Card.Section className="pl-5 pr-6">
              <Chip iconBefore={LmsBook} className="course-chip">COURSE</Chip>
              <h1 className="my-3 mt-4.5">{name}</h1>
              <p className="text-muted">{shortDescription}</p>
            </Card.Section>
          </Card.Body>
          <Card.ImageCap src={buildAssetUrl(courseImageAssetPath)} logoSrc={orgData.logo} />
        </Card>
        <Row className="mt-4 mx-0 px-6 d-flex hero-info course-hero-info">
          {dateDisplay && (
            <div className="d-flex align-items-center">
              <Icon src={AccessTimeFilled} className="mr-4 mb-3" />
              <div>
                <p className="mb-1 font-weight-bold">{dateDisplay}</p>
                <p className="text-muted">Access ends</p>
              </div>
            </div>
          )}
          <div className="d-flex align-items-center">
            <Icon src={Award} className="mr-4 mb-4" />
            <div>
              <p className="mb-1 font-weight-bold">Certificate</p>
              <p className="text-muted">Earn a certificate</p>
            </div>
          </div>
          {duration && (
            <div className="d-flex align-items-center">
              <Icon src={Calendar} className="mr-4 mb-4" />
              <div>
                <p className="mb-1 font-weight-bold">{duration}</p>
                <p className="text-muted">Approx. duration</p>
              </div>
            </div>
          )}
          <div className="d-flex align-items-center">
            <Icon src={Person} className="mr-4 mb-4" />
            <div>
              <p className="mb-1 font-weight-bold">{selfPaced ? 'Self-paced' : 'Instructor-paced'}</p>
              <p className="text-muted">
                {selfPaced ? 'Progress at your own speed' : 'Follow the course schedule'}
              </p>
            </div>
          </div>
        </Row>
      </div>

      {!isModalView && (
        <div className="tabs d-flex align-items-center pl-5.5 pr-0">
          <Button
            variant="primary"
            className="ml-auto rounded-0 py-3 px-5.5 "
            onClick={handleViewClick}
          >
            View
          </Button>
        </div>
      )}

      <div className="py-3">
        <section id="about">
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
    org: PropTypes.string,
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
