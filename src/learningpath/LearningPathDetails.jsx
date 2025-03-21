// src/learningpath/LearningPathDetailPage.jsx
import React, { useEffect, useState, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Button, Row, Col, Spinner, Nav, Icon } from '@edx/paragon';
import { buildAssetUrl } from '../util/assetUrl';
import { fetchCoursesByIds, fetchLearningPathDetail } from './data/api';
import CourseCard from './CourseCard';
import {
  LmsCompletionSolid,
  CheckCircle,
  Timelapse,
  FormatListBulleted,
  AccessTime,
} from '@openedx/paragon/icons';

export default function LearningPathDetailPage() {
  const { uuid } = useParams();
  const [detail, setDetail] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [coursesForPath, setCoursesForPath] = useState([]);
  const [loadingCourses, setLoadingCourses] = useState(false);
  const [coursesError, setCoursesError] = useState(null);

  useEffect(() => {
    async function loadDetail() {
      try {
        setLoading(true);
        const data = await fetchLearningPathDetail(uuid);
        setDetail(data);
      } catch (err) {
        console.error('Failed to fetch learning path detail:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    loadDetail();
  }, [uuid]);

  const courseIds = useMemo(() => {
    return detail && detail.steps ? detail.steps.map(step => step.course_key) : [];
  }, [detail]);

  useEffect(() => {
    if (courseIds.length === 0) return;
    async function loadCourses() {
      try {
        setLoadingCourses(true);
        setCoursesError(null);
        const courses = await fetchCoursesByIds(courseIds);
        setCoursesForPath(courses);
      } catch (err) {
        console.error('Failed to fetch courses:', err);
        setCoursesError(err.message);
      } finally {
        setLoadingCourses(false);
      }
    }
    loadCourses();
  }, [courseIds]);

  let content;
  if (loading) {
    content = <Spinner animation="border" variant="primary" />;
  } else if (error) {
    content = (
      <div className="p-4">
        <p>Failed to load detail</p>
        <Link to="/">Explore</Link>
      </div>
    );
  } else {
    console.log("checking item");
    console.log(detail);

    const {
      display_name,
      image_url,
      subtitle,
      duration_in_days,
      required_skills,
      description,
    } = detail;

    const durationText = duration_in_days ? `${duration_in_days} days` : null;
    const handleTabSelect = (selectedKey) => {
      const el = document.getElementById(selectedKey);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth' });
      }
    };
    content = (
      <div className="learning-path-detail-page">
        <div className="hero-section p-4">
          <div className="mb-3">
              <Link to="/" style={{ fontWeight: 600 }}>
                  Explore
              </Link>
          </div>
          <Row>
              <Col xs={12} md={8}>
                <div className="d-flex lp-type-label text-uppercase text-danger mb-2">
                  <Icon src={FormatListBulleted} className="mr-1" />
                  <span>Learning Path</span>
                </div>
                <h1 className="mb-3">{display_name}</h1>
                {subtitle && (
                <p className="text-muted mb-4" style={{ maxWidth: '80%' }}>
                    {subtitle}
                </p>
                )}
              </Col>
              <Col xs={12} md={4} className="d-flex align-items-center justify-content-center">
                  {image_url && (
                  <img
                      src={buildAssetUrl(image_url)}
                      alt={display_name}
                      style={{ width: '100%', borderRadius: '4px', maxHeight: '250px', objectFit: 'cover' }}
                  />
                  )}
              </Col>
          </Row>
          <Row className="mt-4">
              <Col xs={6} md={3} className="mb-3">
                  <p className="mb-1 font-weight-bold">
                      {'February 28, 2024'}
                  </p>
                  <p className="text-muted">Access ends</p>
              </Col>
              <Col xs={6} md={3} className="mb-3">
                  <p className="mb-1 font-weight-bold">Earn a certificate</p>
                  <p className="text-muted">Some subtext</p>
              </Col>
              <Col xs={6} md={3} className="mb-3">
                  <p className="mb-1 font-weight-bold">
                      {durationText || '6 months'}
                  </p>
                  <p className="text-muted">Duration</p>
              </Col>
              <Col xs={6} md={3} className="mb-3">
                  <p className="mb-1 font-weight-bold">Self-paced</p>
                  <p className="text-muted">Some subtext</p>
              </Col>
          </Row>
        </div>
        <div className="lp-tabs d-flex align-items-center px-4">
          <Nav
            variant="tabs"
            onSelect={handleTabSelect}
            className="border-bottom-0"
          >
            <Nav.Item>
              <Nav.Link eventKey="about">About</Nav.Link>
            </Nav.Item>
            <Nav.Item>
              <Nav.Link eventKey="courses">Courses</Nav.Link>
            </Nav.Item>
            <Nav.Item>
              <Nav.Link eventKey="requirements">Requirements</Nav.Link>
            </Nav.Item>
          </Nav>
        </div>
        <div className="p-4 lp-info">
          <section id="about" className="mb-6">
            <h2>About</h2>
            <p>
              {description || ''}
            </p>
          </section>
          <section id="courses" className="mb-6">
            <h2>Courses</h2>
            {loadingCourses && <Spinner animation="border" variant="primary" />}
            {!loadingCourses && !coursesError && coursesForPath.length === 0 && (
              <p>No sub-courses found in this learning path.</p>
            )}
            {!loadingCourses && !coursesError && coursesForPath.length > 0 && (
              coursesForPath.map(course => (
                <div key={course.course_id} className="mb-3">
                  <CourseCard course={course} />
                </div>
              ))
            )}
          </section>
          <section id="requirements" className="mb-6">
            <h2>Requirements</h2>
            {required_skills.map(skill => (
              <p>
                {skill}
              </p>
            ))}
          </section>
        </div>
      </div>
    );
  }

  return content;
}
