import React, { useMemo, useState } from 'react';
import PropTypes from 'prop-types';
import { Link } from 'react-router-dom';
import {
  Card, Button, Col, ProgressBar, Chip, PageBanner, Icon,
} from '@openedx/paragon';
import {
  LmsBook,
  AccessTime,
  CheckCircle,
  LmsCompletionSolid,
  Timelapse,
  Info,
} from '@openedx/paragon/icons';
import { getAuthenticatedUser } from '@edx/frontend-platform/auth';
import { buildAssetUrl } from '../util/assetUrl';
import {
  usePrefetchCourseDetail, useCourseEnrollmentStatus, useEnrollCourse, useOrganizations,
} from './data/queries';
import { buildCourseHomeUrl } from './utils';
import { useScreenSize } from '../hooks/useScreenSize';

export const CourseCard = ({
  course, relatedLearningPaths, onClick, onClickViewButton, isEnrolledInLearningPath, showFilters = false,
}) => {
  const {
    name,
    org,
    courseImageAssetPath,
    startDate,
    endDate,
    status,
    percent,
    checkingEnrollment,
  } = course;

  const { administrator } = getAuthenticatedUser();
  const { isSmall, isMedium } = useScreenSize();
  const orientation = (showFilters && (isSmall || isMedium)) || (!showFilters && isSmall) ? 'vertical' : 'horizontal';

  // Prefetch the course detail when the user hovers over the card.
  const prefetchCourseDetail = usePrefetchCourseDetail(course.id);
  const handleMouseEnter = () => {
    prefetchCourseDetail();
  };

  const progressBarPercent = useMemo(() => +(percent * 100).toFixed(1), [percent]);

  const linkTo = buildCourseHomeUrl(course.id);

  let statusVariant = 'dark'; // default
  let statusIcon = 'fa-circle'; // default icon
  let buttonText = 'View';
  switch (status?.toLowerCase()) {
    case 'completed':
      statusVariant = 'success';
      statusIcon = CheckCircle;
      break;
    case 'not started':
      statusVariant = 'secondary';
      statusIcon = LmsCompletionSolid;
      buttonText = 'Start';
      break;
    case 'in progress':
      statusVariant = 'info';
      statusIcon = Timelapse;
      buttonText = 'Resume';
      break;
    default:
      break;
  }

  if (checkingEnrollment) {
    buttonText = 'Loading...';
  }

  const disableStartButton = !administrator && (checkingEnrollment || isEnrolledInLearningPath === false);
  let showStartButton = true;

  let accessText = '';
  const currentDate = new Date();

  const startDateObj = startDate ? new Date(startDate) : null;
  const endDateObj = endDate ? new Date(endDate) : null;

  // Determine access text and override button text based on access dates.
  if (startDateObj && startDateObj > currentDate) {
    // Course will start in the future.
    const startDateStr = startDateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    accessText = <>Access starts on <b>{startDateStr}</b></>;
    buttonText = 'Start';
    showStartButton = administrator;
  } else if (endDateObj) {
    const endDateStr = endDateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    if (currentDate > endDateObj) {
      // Course has ended.
      accessText = <>Access ended on <b>{endDateStr}</b></>;
      buttonText = 'View';
      // Remove status, as learners cannot do anything to change it at this point.
      if (status.toLowerCase() !== 'completed') {
        statusVariant = '';
      }
    } else {
      // Course is currently available.
      accessText = <>Access until <b>{endDateStr}</b></>;
    }
  }

  const { data: organizations = {} } = useOrganizations();
  const orgData = useMemo(() => ({
    name: organizations[org]?.name || org,
    logo: organizations[org]?.logo,
  }), [organizations, org]);

  return (
    <>
      <Card orientation={orientation} className={`course-card ${orientation}`} onMouseEnter={handleMouseEnter}>
        <Card.ImageCap
          src={buildAssetUrl(courseImageAssetPath)}
          srcAlt={`${name} course image`}
          logoSrc={orgData.logo}
          logoAlt={`${orgData.name} logo`}
        />
        <Card.Body className="d-flex flex-column">
          <Card.Section className="pb-2.5 d-flex flex-grow-0 justify-content-between chip-section">
            <Chip iconBefore={LmsBook} className="border-0 p-0 course-chip">COURSE</Chip>
            {!!statusVariant && <Chip iconBefore={statusIcon} className={`pl-1 status-chip status-${statusVariant}`}>{status.toUpperCase()}</Chip>}
          </Card.Section>
          <Card.Section className="pt-4 pt-md-1 pb-1"><h3>{name}</h3></Card.Section>
          <Card.Section className="pt-1 pb-1">
            {status.toLowerCase() === 'in progress' && !!statusVariant && (
              <>
                <ProgressBar
                  now={progressBarPercent}
                  label={`${progressBarPercent}%`}
                  variant="primary"
                />
                <div className="x-small text-right pt-1">content completed</div>
              </>
            )}
          </Card.Section>
          <Card.Footer orientation="horizontal" className="pt-3 pb-3 justify-content-between">
            <Col className="d-flex p-0 flex-column-reverse flex-md-row align-items-start w-100 w-md-auto">
              {accessText && (
                <Chip iconBefore={AccessTime} className="border-0 pb-1 pb-md-0 p-0">{accessText}</Chip>
              )}
            </Col>
            <div className="d-flex align-self-end ml-auto">
              {onClickViewButton && (
                <Button variant="secondary" onClick={onClickViewButton} className="mr-2 text-nowrap">More Info</Button>
              )}
              {showStartButton && (
                onClick ? (
                  <Button variant="secondary" onClick={onClick} disabled={disableStartButton}>
                    {buttonText}
                  </Button>
                ) : (
                  <Link to={linkTo}>
                    <Button variant="secondary" disabled={disableStartButton}>{buttonText}</Button>
                  </Link>
                )
              )}
            </div>
          </Card.Footer>
        </Card.Body>
      </Card>
      {relatedLearningPaths && relatedLearningPaths.length > 0 && (
        <PageBanner className="rounded-bottom">
          <div className="d-flex flex-wrap text-left w-100 mt-2 ml-2">
            <div className="d-flex align-items-center">
              <Icon src={Info} className="mr-2" />
              <p className="mb-0">Related Learning Path{relatedLearningPaths.length > 1 ? 's' : ''}:</p>
            </div>
            <ul className="w-100 ml-2 mb-2">
              {relatedLearningPaths.map((learningPath) => (
                <li key={`${course.id}-${learningPath.key}`}>
                  <Link to={`/learningpath/${learningPath.key}`} target="_blank" rel="noopener noreferrer">{learningPath.name}</Link>
                </li>
              ))}
            </ul>
          </div>
        </PageBanner>
      )}
    </>
  );
};

CourseCard.propTypes = {
  course: PropTypes.shape({
    id: PropTypes.string.isRequired,
    name: PropTypes.string.isRequired,
    org: PropTypes.string.isRequired,
    courseImageAssetPath: PropTypes.string,
    startDate: PropTypes.string,
    endDate: PropTypes.string,
    status: PropTypes.string.isRequired,
    percent: PropTypes.number.isRequired,
    checkingEnrollment: PropTypes.bool,
  }).isRequired,
  relatedLearningPaths: PropTypes.arrayOf(PropTypes.shape({
    name: PropTypes.string.isRequired,
    key: PropTypes.string.isRequired,
  })),
  onClick: PropTypes.func,
  onClickViewButton: PropTypes.func,
  isEnrolledInLearningPath: PropTypes.bool,
  showFilters: PropTypes.bool,
};

export const CourseCardWithEnrollment = ({
  course, learningPathId, isEnrolledInLearningPath, onClick,
}) => {
  const { data: enrollmentStatus, isLoading: checkingEnrollment } = useCourseEnrollmentStatus(course.id);
  const [enrolling, setEnrolling] = useState(false);
  const enrollCourseMutation = useEnrollCourse(learningPathId);

  const courseWithEnrollment = {
    ...course,
    isEnrolledInCourse: enrollmentStatus?.isEnrolled || false,
    checkingEnrollment: checkingEnrollment || enrolling,
  };

  // Defined here because calling the MFE config API from an async function can randomly fail.
  const courseHomeUrl = buildCourseHomeUrl(course.id);

  const handleCourseAction = async () => {
    const { administrator } = getAuthenticatedUser();

    if (courseWithEnrollment.isEnrolledInCourse || administrator) {
      window.location.href = courseHomeUrl;
      return;
    }

    setEnrolling(true);
    try {
      const result = await enrollCourseMutation.mutateAsync(course.id);
      if (result.success) {
        window.location.href = courseHomeUrl;
      } else {
        // eslint-disable-next-line no-console
        console.error('Failed to enroll in the course:', result.data?.error || 'Unknown error');
      }
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Failed to enroll in the course:', error);
    } finally {
      setEnrolling(false);
    }
  };

  return (
    <CourseCard
      course={courseWithEnrollment}
      onClick={handleCourseAction}
      onClickViewButton={onClick}
      isEnrolledInLearningPath={isEnrolledInLearningPath}
    />
  );
};

CourseCardWithEnrollment.propTypes = {
  course: PropTypes.shape({
    id: PropTypes.string.isRequired,
  }).isRequired,
  learningPathId: PropTypes.string.isRequired,
  isEnrolledInLearningPath: PropTypes.bool,
  onClick: PropTypes.func.isRequired,
};
