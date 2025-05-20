import React, { useMemo, useState } from 'react';
import PropTypes from 'prop-types';
import { Link } from 'react-router-dom';
import {
  Card, Button, Col, ProgressBar, Chip,
} from '@openedx/paragon';
import {
  LmsBook,
  AccessTime,
  CheckCircle,
  LmsCompletionSolid,
  Timelapse,
} from '@openedx/paragon/icons';
import { buildAssetUrl } from '../util/assetUrl';
import {
  usePrefetchCourseDetail, useCourseEnrollmentStatus, useEnrollCourse, useOrganizations,
} from './data/queries';
import { buildCourseHomeUrl } from './utils';
import { useScreenSize } from '../hooks/useScreenSize';

export const CourseCard = ({
  course, learningPathNames, onClick, onClickViewButton, isEnrolledInLearningPath, showFilters = false,
}) => {
  const {
    name,
    org,
    courseImageAssetPath,
    endDate,
    status,
    percent,
    checkingEnrollment,
  } = course;

  const { isSmall, isMedium } = useScreenSize();
  const orientation = (showFilters && (isSmall || isMedium)) || (!showFilters && isSmall) ? 'vertical' : 'horizontal';

  // Prefetch the course detail when the user hovers over the card.
  const prefetchCourseDetail = usePrefetchCourseDetail(course.id);
  const handleMouseEnter = () => {
    prefetchCourseDetail();
  };

  const progressBarPercent = useMemo(() => Math.round(percent * 100), [percent]);

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
      statusVariant = 'dark';
      statusIcon = 'fa-circle';
      break;
  }
  const endDateFormatted = endDate
    ? new Date(endDate).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    })
    : null;

  if (checkingEnrollment) {
    buttonText = 'Loading...';
  }

  const disableStartButton = checkingEnrollment || isEnrolledInLearningPath === false;

  const { data: organizations = {} } = useOrganizations();
  const orgData = useMemo(() => ({
    name: organizations[org]?.name || org,
    logo: organizations[org]?.logo,
  }), [organizations, org]);

  return (
    <Card orientation={orientation} className="course-card" onMouseEnter={handleMouseEnter}>
      <Card.ImageCap src={buildAssetUrl(courseImageAssetPath)} logoSrc={orgData.logo} />
      <Card.Body>
        <Card.Section className="pb-2.5 d-flex justify-content-between">
          <Chip iconBefore={LmsBook} className="border-0 p-0 course-chip">COURSE</Chip>
          <Chip iconBefore={statusIcon} className={`pl-1 status-chip status-${statusVariant}`}>{status.toUpperCase()}</Chip>
        </Card.Section>
        <Card.Section className="pt-1 pb-1"><h3>{name}</h3></Card.Section>
        {learningPathNames && (
          <Card.Section className="pt-1 pb-1 card-subtitle text-muted">
            {learningPathNames.length === 1 ? (
              <span>Part of {learningPathNames[0]}</span>
            ) : (
              <>
                <div>Part of:</div>
                <ul className="pl-4 mb-0 mt-1">
                  {learningPathNames.map((pathName) => (<li>{pathName}</li>))}
                </ul>
              </>
            )}
          </Card.Section>
        )}
        <Card.Section className="pt-1 pb-1 card-subtitle text-muted">{orgData.name}</Card.Section>
        <Card.Section className="pt-1 pb-1">
          {status.toLowerCase() === 'in progress' && (
            <ProgressBar.Annotated
              now={progressBarPercent}
              label={`${progressBarPercent}%`}
              variant="dark"
            />
          )}
        </Card.Section>
        <Card.Footer orientation="horizontal" className="pt-3 pb-3 justify-content-between">
          <Col className="p-0">
            {endDateFormatted && (
              <Chip iconBefore={AccessTime} className="border-0 p-0">Access until <b>{endDateFormatted}</b></Chip>
            )}
          </Col>
          {onClickViewButton && (
            <Button variant="outline-primary" onClick={onClickViewButton} className="mr-2">More Info</Button>
          )}
          {onClick ? (
            <Button variant="outline-primary" onClick={onClick} disabled={disableStartButton}>
              {buttonText}
            </Button>
          ) : (
            <Link to={linkTo}>
              <Button variant="outline-primary">{buttonText}</Button>
            </Link>
          )}
        </Card.Footer>
      </Card.Body>
    </Card>
  );
};

CourseCard.propTypes = {
  course: PropTypes.shape({
    id: PropTypes.string.isRequired,
    name: PropTypes.string.isRequired,
    org: PropTypes.string.isRequired,
    courseImageAssetPath: PropTypes.string,
    endDate: PropTypes.string,
    status: PropTypes.string.isRequired,
    percent: PropTypes.number.isRequired,
    checkingEnrollment: PropTypes.bool,
  }).isRequired,
  learningPathNames: PropTypes.arrayOf(PropTypes.string),
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
    if (courseWithEnrollment.isEnrolledInCourse) {
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
