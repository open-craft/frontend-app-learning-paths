import React, { useMemo } from 'react';
import PropTypes from 'prop-types';
import { Link } from 'react-router-dom';
import {
  Card,
  Button,
  ProgressBar,
  Chip,
} from '@openedx/paragon';
import {
  LmsCompletionSolid,
  CheckCircle,
  Timelapse,
  FormatListBulleted,
  AccessTime,
} from '@openedx/paragon/icons';
import { useOrganizations, usePrefetchLearningPathDetail } from './data/queries';
import { useScreenSize } from '../hooks/useScreenSize';

const LearningPathCard = ({ learningPath, showFilters = false }) => {
  const {
    key,
    image,
    displayName,
    subtitle,
    duration,
    numCourses,
    status,
    minDate,
    maxDate,
    percent,
    org,
  } = learningPath;

  const { isSmall, isMedium } = useScreenSize();
  const orientation = (showFilters && (isSmall || isMedium)) || (!showFilters && isSmall) ? 'vertical' : 'horizontal';

  // Prefetch the learning path detail when the user hovers over the card.
  const prefetchLearningPathDetail = usePrefetchLearningPathDetail();
  const handleMouseEnter = () => {
    prefetchLearningPathDetail(key);
  };

  let statusVariant = 'dark';
  let statusIcon = 'fa-circle';
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

  let accessText = '';
  const currentDate = new Date();

  // Determine access text and override button text based on access dates.
  if (minDate && minDate > currentDate) {
    // Learning path will start in the future.
    const minDateStr = minDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    accessText = <>Access starts on <b>{minDateStr}</b></>;
    buttonText = 'View';
  } else if (maxDate) {
    const maxDateStr = maxDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    if (currentDate > maxDate) {
      // Learning path has ended.
      accessText = <>Access ended on <b>{maxDateStr}</b></>;
      buttonText = 'View';
      // Remove status, as learners cannot do anything to change it at this point.
      if (status.toLowerCase() !== 'completed') {
        statusVariant = '';
      }
    } else {
      // Learning path is currently available.
      accessText = <>Access until <b>{maxDateStr}</b></>;
    }
  }
  const subtitleLine = subtitle && duration
    ? `${subtitle} • ${duration} days`
    : subtitle || duration || '';

  const { data: organizations = {} } = useOrganizations();
  const orgData = useMemo(() => ({
    name: organizations[org]?.name || org,
    logo: organizations[org]?.logo,
  }), [organizations, org]);

  const progressBarPercent = percent ? +percent.toFixed(1) : '0.0';

  return (
    <Card orientation={orientation} className={`lp-card ${orientation}`} onMouseEnter={handleMouseEnter}>
      <Card.ImageCap
        src={image}
        srcAlt={`${displayName} learning path image`}
        logoSrc={orgData.logo}
        logoAlt={`${orgData.name} logo`}
        className={orientation}
      />
      <Card.Body>
        <Card.Section className="pb-2.5 d-flex justify-content-between chip-section">
          <Chip iconBefore={FormatListBulleted} className="border-0 p-0 lp-chip">LEARNING PATH</Chip>
          {!!statusVariant && <Chip iconBefore={statusIcon} className={`pl-1 status-chip status-${statusVariant}`}>{status.toUpperCase()}</Chip>}
        </Card.Section>
        <Card.Section className="pt-1 pb-1 title"><h3>{displayName}</h3></Card.Section>
        <Card.Section className="pt-1 pb-1 card-subtitle text-muted">{subtitleLine}</Card.Section>
        <Card.Section className="pt-1 pb-1">
          {status.toLowerCase() === 'in progress' && !!statusVariant && (
            orientation === 'vertical' ? (
              <ProgressBar
                now={progressBarPercent}
                label={`${progressBarPercent}%`}
                variant="primary"
              />
            ) : (
              <ProgressBar.Annotated
                now={progressBarPercent}
                label={`${progressBarPercent}%`}
                variant="dark"
              />
            )
          )}
        </Card.Section>
        <Card.Footer orientation="horizontal" className="pt-3 pb-3 justify-content-between">
          <Card.Section className="p-0">
            {numCourses && (
              <Chip iconBefore={FormatListBulleted} className="border-0 p-0">{numCourses} courses</Chip>
            )}
            {accessText && (
              <Chip iconBefore={AccessTime} className="border-0 p-0">{accessText}</Chip>
            )}
          </Card.Section>
          <Link to={`/learningpath/${key}`}>
            <Button variant="outline-primary">{buttonText}</Button>
          </Link>
        </Card.Footer>
      </Card.Body>
    </Card>
  );
};

LearningPathCard.propTypes = {
  learningPath: PropTypes.shape({
    key: PropTypes.string.isRequired,
    image: PropTypes.string,
    displayName: PropTypes.string.isRequired,
    subtitle: PropTypes.string,
    duration: PropTypes.string,
    numCourses: PropTypes.number,
    status: PropTypes.string.isRequired,
    minDate: PropTypes.instanceOf(Date),
    maxDate: PropTypes.instanceOf(Date),
    percent: PropTypes.number,
    org: PropTypes.string,
  }).isRequired,
  showFilters: PropTypes.bool,
};

export default LearningPathCard;
