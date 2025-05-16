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
      statusVariant = 'dark';
      statusIcon = 'fa-circle';
      break;
  }

  const currentDate = new Date();
  const accessDateObj = new Date(maxDate);
  const accessText = currentDate > accessDateObj
    ? 'Access ended'
    : `Access until ${accessDateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`;

  const subtitleLine = subtitle && duration
    ? `${subtitle} • ${duration} days`
    : subtitle || duration || '';

  const { data: organizations = {} } = useOrganizations();
  const orgData = useMemo(() => ({
    name: organizations[org]?.name || org,
    logo: organizations[org]?.logo,
  }), [organizations, org]);

  return (
    <Card orientation={orientation} className="lp-card" onMouseEnter={handleMouseEnter}>
      <Card.ImageCap src={image} logoSrc={orgData.logo} />
      <Card.Body>
        <Card.Section className="pb-2.5 d-flex justify-content-between">
          <Chip iconBefore={FormatListBulleted} className="border-0 p-0 lp-chip">LEARNING PATH</Chip>
          <Chip iconBefore={statusIcon} className={`pl-1 status-chip status-${statusVariant}`}>{status.toUpperCase()}</Chip>
        </Card.Section>
        <Card.Section className="pt-1 pb-1"><h3>{displayName}</h3></Card.Section>
        <Card.Section className="pt-1 pb-1 card-subtitle text-muted">{subtitleLine}</Card.Section>
        <Card.Section className="pt-1 pb-1">
          {status.toLowerCase() === 'in progress' && (
            <ProgressBar.Annotated
              now={Math.round(percent)}
              label={`${Math.round(percent)}%`}
              variant="dark"
            />
          )}
        </Card.Section>
        <Card.Footer orientation="horizontal" className="pt-3 pb-3 justify-content-between">
          <Card.Section className="p-0">
            {numCourses && (
              <Chip iconBefore={FormatListBulleted} className="border-0 p-0">{numCourses} courses</Chip>
            )}
            {maxDate && (
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
    maxDate: PropTypes.string,
    percent: PropTypes.number,
    org: PropTypes.string,
  }).isRequired,
  showFilters: PropTypes.bool,
};

export default LearningPathCard;
