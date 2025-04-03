import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { getConfig } from '@edx/frontend-platform';
import {
  Spinner,
  Card,
  Row,
  Col,
  Nav,
  Icon,
  ModalCloseButton,
  Button
} from '@openedx/paragon';
import { fetchCoursesByIds } from './data/api';
import {
  LmsBook,
  AccessTimeFilled,
  Award,
  Calendar,
  Person,
  Close,
} from '@openedx/paragon/icons';
import { buildAssetUrl } from '../util/assetUrl';

export default function CourseDetailPage({ isModalView = false, onClose }) {
  const { courseKey } = useParams();
  const [course, setCourse] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function loadCourse() {
      try {
        setLoading(true);
        const data = await fetchCoursesByIds([courseKey]);
        setCourse(data[0]);
      } catch (err) {
        console.error('Failed to load course detail:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    loadCourse();
  }, [courseKey]);

  if (loading) {
    return <Spinner animation="border" variant="primary" />;
  }

  if (error) {
    return (
      <div className="p-4">
        <Alert variant="danger">Failed to load course detail: {error}</Alert>
        <Link to="/">Back</Link>
      </div>
    );
  }

  if (!course) {
    return <Spinner animation="border" variant="primary" />;
  }

  return (
    <div className="course-detail-page">
      {isModalView ? (
        <CourseDetailContent course={course} isModalView onClose={onClose}/>
      ) : (
        <CourseDetailContent course={course} />
      )}
    </div>
  );
}

function CourseDetailContent({course, isModalView, onClose}) {
  const {
    name,
    short_description,
    end_date,
    duration,
    self_paced,
    course_image_asset_path,
    description,
    learning_info,
    instructor_info,
  } = course;

  const dateDisplay = end_date
    ? new Date(end_date).toLocaleDateString('en-US', {
        month: 'long',
        day: 'numeric',
        year: 'numeric',
      })
    : null;

  const handleTabSelect = (selectedKey) => {
    const el = document.getElementById(selectedKey);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };
  const navigate = useNavigate();
  const handleClose = onClose || (() => navigate(-1));
  const { courseKey } = useParams();
  const learningMfeBase = getConfig().LEARNING_BASE_URL;
  const buildCourseHomeUrl = (key) => {
    return `${learningMfeBase}/learning/course/${key}/home`;
  };
  const handleViewClick = () => {
    window.location.href = buildCourseHomeUrl(courseKey);
  };

  return (
    <>
      <div className="hero-section p-4">
        {!isModalView && (
          <div className="mb-3">
            <Link to="/" style={{ fontWeight: 600 }}>Explore</Link>
          </div>
        )}
        {isModalView && (
          <div className="pgn__modal-close-container">
            <ModalCloseButton variant="tertiary" onClick={handleClose}>
              <Icon src={Close} />
            </ModalCloseButton>
          </div>
        )}
        <Row>
          <Col xs={12} md={8}>
            <div className="course-type-label text-uppercase mb-2">
                <Icon src={LmsBook} className="mr-1" />
                <span>Course</span>
            </div>
            <h1 className="mb-2">{name}</h1>
            {short_description && (
              <p className="text-muted mb-4">{short_description}</p>
            )}
          </Col>
          <Col xs={12} md={4}>
            {course_image_asset_path && (
                <Card.ImageCap
                    src={buildAssetUrl(course_image_asset_path)}
                    alt={name}
                    className="course-card-image"
                />
            )}
          </Col>
        </Row>
        <Row className="mt-4">
            {dateDisplay && (
                <Col xs={6} md={3} className="mb-3">
                    <div className="d-flex align-items-center">
                        <Icon src={AccessTimeFilled} className="mr-4 mb-3" />
                        <div>
                            <p className="mb-1 font-weight-bold">{dateDisplay}</p>
                            <p className="text-muted">Access ends</p>
                        </div>
                    </div>
                </Col>
            )}
            <Col xs={6} md={3} className="mb-3">
                <div className="d-flex align-items-center">
                    <Icon src={Award} className="mr-4 mb-4" />
                    <div>
                        <p className="mb-1 font-weight-bold">Earn a certificate</p>
                        <p className="text-muted">Courses include certification</p>
                    </div>
                </div>
            </Col>
          {duration && (
            <Col xs={6} md={3} className="mb-3">
                <div className="d-flex align-items-center">
                    <Icon src={Calendar} className="mr-4 mb-4" />
                    <div>
                        <p className="mb-1 font-weight-bold">{duration}</p>
                        <p className="text-muted">Approx. duration</p>
                    </div>
                </div>
            </Col>
          )}
          {self_paced == true && (
            <Col xs={6} md={3} className="mb-3">
                <div className="d-flex align-items-center">
                    <Icon src={Person} className="mr-4 mb-4" />
                    <div>
                        <p className="mb-1 font-weight-bold">Self-paced</p>
                        <p className="text-muted">Learn at your own speed</p>
                    </div>
                </div>
            </Col>
          )}
        </Row>
      </div>

      <div className="lp-tabs d-flex align-items-center px-4">
        <Nav variant="tabs" onSelect={handleTabSelect} className="border-bottom-0">
          <Nav.Item>
            <Nav.Link eventKey="about">About</Nav.Link>
          </Nav.Item>
          <Nav.Item>
            <Nav.Link eventKey="learning">What you’ll learn</Nav.Link>
          </Nav.Item>
          <Nav.Item>
            <Nav.Link eventKey="instructors">Instructors</Nav.Link>
          </Nav.Item>
        </Nav>
        <Button
          variant="primary"
          className="ml-auto"
          onClick={handleViewClick}
        >
          View
        </Button>
      </div>

      <div className="p-4">
        <section id="about" className="mb-6">
          <h2>About</h2>
          <p>
            {description || short_description}
          </p>
        </section>

        <section id="learning" className="mb-6">
          <h2>What you'll learn</h2>
          {learning_info.map((learning) => (
            <p key={learning}>
              * {learning}
            </p>
          ))}
        </section>

        <section id="instructors" className="mb-6">
          <h2>Instructors</h2>
          <Row>
            {instructor_info && instructor_info.instructors.length > 0 ? (
              instructor_info.instructors.map((inst, index) => (
                <Col xs={12} md={6} lg={3} key={index} className="mb-4">
                  <div className="instructor-card">
                    <img
                      src={inst.image || 'placeholder.jpg'}
                      alt={inst.name}
                      className="instructor-image"
                    />
                    <p className="instructor-name mt-2 mb-1 font-weight-bold">
                      {inst.name}
                    </p>
                    {inst.title && <p className="instructor-title mb-1">{inst.title}</p>}
                    {inst.organization && (
                      <p className="instructor-org text-muted mb-1">{inst.organization}</p>
                    )}
                  </div>
                </Col>
              ))
            ) : (
              <Col>
                <p>No instructors listed for this course.</p>
              </Col>
            )}
          </Row>
        </section>
      </div>
    </>
  );
}
