import React from 'react';
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

const LearningPathCard = ({ learningPath }) => {
  const {
    key,
    image_url,
    display_name,
    subtitle,
    duration,
    num_courses,
    status,
    maxDate,
    percent,
  } = learningPath;

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
    <Card className="learning-path-card p-3 position-relative">
      <div className="lp-status-badge">
        <Badge variant={statusVariant} className="d-flex align-items-center">
          <Icon src={statusIcon} className="mr-1" />
          {status}
        </Badge>
      </div>
      <Row>
        <Col xs={12} md={4} className="lp-card-image-col">
          {image_url && (
            <Card.ImageCap
              src={buildAssetUrl(image_url)}
              alt={display_name}
              className="lp-card-image"
            />
          )}
        </Col>
        <Col xs={12} md={8}>
          <div className="lp-type-label text-uppercase mb-2">
            <Icon src={FormatListBulleted} className="mr-1" />
            <span>Learning Path</span>
          </div>
          <Card.Header className="p-0 mb-2" title={display_name} />
          {subtitleLine && (
            <p className="card-subtitle text-muted mb-2">
              {subtitleLine}
            </p>
          )}
          {status === 'In progress' && (
            <ProgressBar.Annotated
              now={Math.round(percent)}
              label={`${Math.round(percent)}%`}
              variant="dark"
              className="mb-2"
            />
          )}
          <Card.Footer className="p-3 d-flex align-items-center">
            <div className="lp-meta d-flex flex-wrap mr-auto mb-2">
              {num_courses && (
                <div className="mr-3 d-flex align-items-center">
                  <Icon src={FormatListBulleted} className="mr-1" />
                  {num_courses} courses
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

export default LearningPathCard;
