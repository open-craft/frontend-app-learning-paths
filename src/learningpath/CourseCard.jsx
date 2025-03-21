import React from 'react';
import { Card, Button, Row, Col, Icon, Badge } from '@edx/paragon';
import { buildAssetUrl } from '../util/assetUrl';
import {
    LmsBook,
    AccessTime,
    CheckCircle,
    LmsCompletionSolid,
    Timelapse,
} from '@openedx/paragon/icons';

const CourseCard = ({ course }) => {
    const {
        name,
        org,
        course_image_asset_path,
        end_date,
        status,
    } = course;

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
    const endDateFormatted = end_date
    ? new Date(end_date).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      })
    : null;
    return (
        <Card className="course-card p-3">
            <div className="lp-status-badge">
                <Badge variant={statusVariant} className="d-flex align-items-center">
                    <Icon src={statusIcon} className="mr-1" />
                    {status}
                </Badge>
            </div>
            <Row>
                <Col xs={12} md={4} className="course-card-image-col">
                {course_image_asset_path && (
                    <Card.ImageCap 
                        src={buildAssetUrl(course_image_asset_path)}
                        alt={name}
                        style={{ maxHeight: '150px', objectFit: 'cover' }}
                    />
                )}
                </Col>
                <Col xs={12} md={8}>
                    <div className="d-flex lp-type-label text-uppercase text-muted mb-2">
                        <Icon src={LmsBook} className="mr-1" />
                        <span>Course</span>
                    </div>
                    <Card.Header className="p-0 mb-2" title={name} />
                    {org && <p className="card-subtitle text-muted mb-2">{org}</p>}
                    {endDateFormatted && (
                        <div className="mr-3 d-flex align-items-center">
                            <Icon src={AccessTime} className="mr-1" />
                            Access until {endDateFormatted}
                        </div>
                    )}
                    <Card.Footer className="p-0">
                    <Button variant="outline-primary" href={`#`}>
                        View
                    </Button>
                    </Card.Footer>
                </Col>
            </Row>
        </Card>
    );
};

export default CourseCard;