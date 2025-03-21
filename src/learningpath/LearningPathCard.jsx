import React from 'react';
import { Link } from 'react-router-dom';
import {
  Card,
  Button,
  Row,
  Col,
  Badge,
  Icon, 
} from '@edx/paragon';
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
    uuid,
    image_url,
    display_name,
    subtitle,
    duration,
    num_courses,
    status,
  } = learningPath;

  let statusVariant = 'dark';   // default
  let statusIcon = 'fa-circle'; // default icon
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
      // fallback if unknown
      statusVariant = 'dark';
      statusIcon = 'fa-circle';
      break;
  }

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
          <div className="d-flex lp-type-label text-uppercase text-danger mb-2">
            <Icon src={FormatListBulleted} className="mr-1" />
            <span>Learning Path</span>
          </div>
          <Card.Header className="p-0 mb-2" title={display_name} />
          {subtitleLine && (
            <p className="card-subtitle text-muted mb-2">
              {subtitleLine}
            </p>
          )}
          <div className="lp-meta d-flex flex-wrap mb-2">
            {num_courses && (
              <div className="mr-3 d-flex align-items-center">
                <Icon src={FormatListBulleted} className="mr-1" />
                {num_courses} courses
              </div>
            )}

            {/* Access expiry */}
            
            <div className="mr-3 d-flex align-items-center">
              <Icon src={AccessTime} className="mr-1" />
              Access until
            </div>
          </div>
          <Card.Footer className="p-0 mt-3">
            <Link to={`/learningpath/${uuid}`}>
              <Button variant="outline-primary">View</Button>
            </Link>
          </Card.Footer>  
        </Col>
      </Row>
    </Card>
  );
};

export default LearningPathCard;