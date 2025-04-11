import React from 'react';
import PropTypes from 'prop-types';
import { Link } from 'react-router-dom';
import {
  Card,
  Button,
  Row,
  Col,
  Badge,
  Icon,
  ProgressBar,
} from '@openedx/paragon';
import {
  LmsCompletionSolid,
  CheckCircle,
  Timelapse,
  FormatListBulleted,
  AccessTime,
} from '@openedx/paragon/icons';
import { buildAssetUrl } from '../util/assetUrl';
import { usePrefetchLearningPathDetail } from './data/queries';

const LearningPathCard = ({ learningPath }) => {
  const {
    key,
    imageUrl,
    displayName,
    subtitle,
    duration,
    numCourses,
    status,
    maxDate,
    percent,
  } = learningPath;

  // Prefetch the learning path detail when the user hovers over the card.
  const prefetchLearningPathDetail = usePrefetchLearningPathDetail();
  const handleMouseEnter = () => {
    prefetchLearningPathDetail(key);
  };

  let statusVariant = 'dark';
  let statusIcon = 'fa-circle';
  switch (status?.toLowerCase()) {
    case 'completed':
      statusVariant = 'success';
      statusIcon = CheckCircle;
      break;
    case 'not started':
      statusVariant = 'secondary';
      statusIcon = LmsCompletionSolid;
      break;
    case 'in progress':
      statusVariant = 'info';
      statusIcon = Timelapse;
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

  return (
    <Card className="learning-path-card p-3 position-relative" onMouseEnter={handleMouseEnter}>
      <div className="lp-status-badge">
        <Badge variant={statusVariant} className="d-flex align-items-center">
          <Icon src={statusIcon} className="mr-1" />
          {status}
        </Badge>
      </div>
      <Row>
        <Col xs={12} md={4} className="lp-card-image-col">
          {imageUrl && (
            <Card.ImageCap
              src={buildAssetUrl(imageUrl)}
              alt={displayName}
              className="lp-card-image"
            />
          )}
        </Col>
        <Col xs={12} md={8}>
          <div className="lp-type-label text-uppercase mb-2">
            <Icon src={FormatListBulleted} className="mr-1" />
            <span>Learning Path</span>
          </div>
          <Card.Header className="p-0 mb-2" title={displayName} />
          {subtitleLine && (
            <p className="card-subtitle text-muted mb-2">
              {subtitleLine}
            </p>
          )}
          {status.toLowerCase() === 'in progress' && (
            <ProgressBar.Annotated
              now={Math.round(percent)}
              label={`${Math.round(percent)}%`}
              variant="dark"
              className="mb-2"
            />
          )}
          <Card.Footer className="p-3 d-flex align-items-center">
            <div className="lp-meta d-flex flex-wrap mr-auto mb-2">
              {numCourses && (
                <div className="mr-3 d-flex align-items-center">
                  <Icon src={FormatListBulleted} className="mr-1" />
                  {numCourses} courses
                </div>
              )}
              {maxDate && (
                <div className="mr-6 d-flex align-items-center">
                  <Icon src={AccessTime} className="mr-1" />
                  {accessText}
                </div>
              )}
            </div>
            <Link to={`/learningpath/${key}`}>
              <Button variant="outline-primary">View</Button>
            </Link>
          </Card.Footer>
        </Col>
      </Row>
    </Card>
  );
};

LearningPathCard.propTypes = {
  learningPath: PropTypes.shape({
    key: PropTypes.string.isRequired,
    imageUrl: PropTypes.string,
    displayName: PropTypes.string.isRequired,
    subtitle: PropTypes.string,
    duration: PropTypes.string,
    numCourses: PropTypes.number,
    status: PropTypes.string.isRequired,
    maxDate: PropTypes.string,
    percent: PropTypes.number,
  }).isRequired,
};

export default LearningPathCard;
