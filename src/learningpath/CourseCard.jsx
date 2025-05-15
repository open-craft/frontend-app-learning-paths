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
import { usePrefetchCourseDetail, useCourseEnrollmentStatus, useEnrollCourse } from './data/queries';
import { buildCourseHomeUrl } from './utils';
import { useScreenSize } from '../hooks/useScreenSize';

export const CourseCard = ({
  course, parentPath, onClick, showFilters = false,
}) => {
  const courseKey = course.id;
  const {
    name,
    org,
    courseImageAssetPath,
    endDate,
    status,
    percent,
    isEnrolledInCourse,
    checkingEnrollment,
  } = course;

  const { isSmall, isMedium } = useScreenSize();
  const orientation = (showFilters && (isSmall || isMedium)) || (!showFilters && isSmall) ? 'vertical' : 'horizontal';

  // Prefetch the course detail when the user hovers over the card.
  const prefetchCourseDetail = usePrefetchCourseDetail(courseKey);
  const handleMouseEnter = () => {
    prefetchCourseDetail();
  };

  const progressBarPercent = useMemo(() => Math.round(percent * 100), [percent]);

  const linkTo = parentPath
    ? `${parentPath}/course/${courseKey}`
    : `/course/${courseKey}`;

  const handleViewClick = (e) => {
    if (onClick) {
      e.preventDefault();
      onClick(courseKey);
    }
  };

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

  let buttonVariant = 'outline-primary';

  // Update the button based on enrollment status (if available).
  if (isEnrolledInCourse === false) {
    buttonText = 'Start';
    buttonVariant = 'primary';
  } else if (isEnrolledInCourse === true) {
    buttonText = 'Resume';
    buttonVariant = 'outline-success';
  }

  if (checkingEnrollment) {
    buttonText = 'Loading...';
  }

  return (
    <Card orientation={orientation} className="course-card" onMouseEnter={handleMouseEnter}>
      <Card.ImageCap src={buildAssetUrl(courseImageAssetPath)} />
      <Card.Body>
        <Card.Section className="pb-2.5 d-flex justify-content-between">
          <Chip iconBefore={LmsBook} className="border-0 p-0 course-chip">COURSE</Chip>
          <Chip iconBefore={statusIcon} className={`status-chip status-${statusVariant}`}>{status.toUpperCase()}</Chip>
        </Card.Section>
        <Card.Section className="pt-1 pb-1"><h3>{name}</h3></Card.Section>
        <Card.Section className="pt-1 pb-1 card-subtitle text-muted">{org}</Card.Section>
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
          {onClick ? (
            <Button variant={buttonVariant} onClick={handleViewClick} disabled={checkingEnrollment}>
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
    isEnrolledInCourse: PropTypes.bool,
    checkingEnrollment: PropTypes.bool,
  }).isRequired,
  parentPath: PropTypes.string,
  onClick: PropTypes.func,
  showFilters: PropTypes.bool,
};

export const CourseCardWithEnrollment = ({ course, learningPathId }) => {
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
    />
  );
};

CourseCardWithEnrollment.propTypes = {
  course: PropTypes.shape({
    id: PropTypes.string.isRequired,
  }).isRequired,
  learningPathId: PropTypes.string.isRequired,
};
