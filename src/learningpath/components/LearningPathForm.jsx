import React, { useEffect, useMemo, useState } from 'react';
import PropTypes from 'prop-types';
import { Link } from 'react-router-dom';
import {
  Card, Form, Button, Alert, Icon,
} from '@openedx/paragon';
import { ChevronLeft } from '@openedx/paragon/icons';
import CourseSearchPicker from './CourseSearchPicker';
import StepsDragList from './StepsDragList';
import './LearningPathForm.scss';

const LEVEL_CHOICES = [
  { value: '', label: 'Select a level' },
  { value: 'beginner', label: 'Beginner' },
  { value: 'intermediate', label: 'Intermediate' },
  { value: 'advanced', label: 'Advanced' },
];

const KEY_PART_PATTERN = /^[^+]+$/;

const formatError = (error) => {
  const apiError = error?.response?.data;
  if (apiError && typeof apiError === 'object') {
    return Object.entries(apiError).map(([field, msgs]) => `${field}: ${[].concat(msgs).join(' ')}`).join(' ');
  }
  return 'Failed to save the learning path. Please try again.';
};

const LearningPathForm = ({
  title, keyEditable, fixedKey, initial, submitLabel, submitting, onSubmit,
}) => {
  useEffect(() => {
    const id = setTimeout(() => window.scrollTo({ top: 0, behavior: 'instant' }), 10);
    return () => clearTimeout(id);
  }, []);

  const [keyParts, setKeyParts] = useState(initial.keyParts || {
    org: '', number: '', run: '', group: '',
  });
  const [displayName, setDisplayName] = useState(initial.displayName || '');
  const [subtitle, setSubtitle] = useState(initial.subtitle || '');
  const [description, setDescription] = useState(initial.description || '');
  const [level, setLevel] = useState(initial.level || '');
  const [duration, setDuration] = useState(initial.duration || '');
  const [timeCommitment, setTimeCommitment] = useState(initial.timeCommitment || '');
  const [sequential, setSequential] = useState(initial.sequential || false);
  const [inviteOnly, setInviteOnly] = useState(initial.inviteOnly ?? true);
  const [steps, setSteps] = useState(initial.steps || []);
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(initial.imageUrl || null);
  const [formError, setFormError] = useState(null);
  const [isSaving, setIsSaving] = useState(false);

  const learningPathKey = useMemo(() => {
    if (!keyEditable) {
      return fixedKey;
    }
    const {
      org, number, run, group,
    } = keyParts;
    return `path-v1:${org}+${number}+${run}+${group}`;
  }, [keyEditable, fixedKey, keyParts]);

  const keyPartsValid = !keyEditable
    || Object.values(keyParts).every((part) => part.length > 0 && KEY_PART_PATTERN.test(part));
  const canSubmit = keyPartsValid && displayName.trim().length > 0 && !submitting && !isSaving;

  const handleKeyPartChange = (part) => (e) => {
    setKeyParts((prev) => ({ ...prev, [part]: e.target.value.trim() }));
  };

  const handleAddCourse = (course) => {
    setSteps((prev) => (prev.some((s) => s.courseKey === course.id)
      ? prev
      : [...prev, { courseKey: course.id, name: course.name, weight: 1 }]));
  };

  const handleRemoveStep = (courseKey) => {
    setSteps((prev) => prev.filter((s) => s.courseKey !== courseKey));
  };

  const handleChangeWeight = (courseKey, weight) => {
    setSteps((prev) => prev.map((s) => (s.courseKey === courseKey ? { ...s, weight } : s)));
  };

  const handleImageChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError(null);

    if (!keyPartsValid) {
      setFormError('Org, Number, Run, and Group are required and cannot contain a "+" character.');
      return;
    }
    if (!displayName.trim()) {
      setFormError('Display name is required.');
      return;
    }

    const payload = {
      key: learningPathKey,
      displayName: displayName.trim(),
      subtitle,
      description,
      level,
      duration,
      timeCommitment,
      sequential,
      inviteOnly,
      steps: steps.map((step, index) => ({
        courseKey: step.courseKey,
        order: index + 1,
        weight: Number(step.weight) || 0,
      })),
    };

    setIsSaving(true);
    try {
      await onSubmit(payload, imageFile);
    } catch (error) {
      setFormError(formatError(error));
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="create-learning-path-page p-4 container">
      <Link to="/" className="d-flex align-items-center back-link mb-3">
        <Icon src={ChevronLeft} />
        <span>Go Back</span>
      </Link>

      <h1>{title}</h1>

      {formError && <Alert variant="danger" className="mt-3">{formError}</Alert>}

      <Form onSubmit={handleSubmit} className="mt-3">
        <Card className="mb-4">
          <Card.Body>
            <Card.Section>
              <h3>Identity</h3>
              {keyEditable ? (
                <div className="d-flex flex-wrap" style={{ gap: '1rem' }}>
                  {['org', 'number', 'run', 'group'].map((part) => (
                    <Form.Group key={part} style={{ minWidth: '150px', flex: 1 }}>
                      <Form.Label className="text-capitalize">{part}</Form.Label>
                      <Form.Control
                        value={keyParts[part]}
                        onChange={handleKeyPartChange(part)}
                        placeholder={part}
                      />
                    </Form.Group>
                  ))}
                </div>
              ) : (
                <p className="mb-0"><code>{learningPathKey}</code></p>
              )}
              {keyEditable && (
                <p className="text-muted small">
                  Key preview: <code>{learningPathKey}</code>
                </p>
              )}
            </Card.Section>

            <Card.Section>
              <h3>Details</h3>
              <Form.Group>
                <Form.Label>Display name</Form.Label>
                <Form.Control value={displayName} onChange={(e) => setDisplayName(e.target.value)} />
              </Form.Group>
              <Form.Group>
                <Form.Label>Subtitle</Form.Label>
                <Form.Control value={subtitle} onChange={(e) => setSubtitle(e.target.value)} />
              </Form.Group>
              <Form.Group>
                <Form.Label>Description</Form.Label>
                <Form.Control
                  as="textarea"
                  rows={4}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
              </Form.Group>
              <Form.Group>
                <Form.Label>Cover image</Form.Label>
                <Form.Control type="file" accept="image/*" onChange={handleImageChange} />
                {imagePreview && (
                  <img
                    src={imagePreview}
                    alt="Learning path cover preview"
                    className="mt-2 rounded"
                    style={{ maxWidth: '320px', maxHeight: '160px', objectFit: 'cover' }}
                  />
                )}
              </Form.Group>
              <div className="d-flex flex-wrap" style={{ gap: '1rem' }}>
                <Form.Group style={{ minWidth: '200px', flex: 1 }}>
                  <Form.Label>Level</Form.Label>
                  <Form.Control as="select" value={level} onChange={(e) => setLevel(e.target.value)}>
                    {LEVEL_CHOICES.map((choice) => (
                      <option key={choice.value} value={choice.value}>{choice.label}</option>
                    ))}
                  </Form.Control>
                </Form.Group>
                <Form.Group style={{ minWidth: '200px', flex: 1 }}>
                  <Form.Label>Duration</Form.Label>
                  <Form.Control
                    value={duration}
                    onChange={(e) => setDuration(e.target.value)}
                    placeholder="e.g. 10 Weeks"
                  />
                </Form.Group>
                <Form.Group style={{ minWidth: '200px', flex: 1 }}>
                  <Form.Label>Time commitment</Form.Label>
                  <Form.Control
                    value={timeCommitment}
                    onChange={(e) => setTimeCommitment(e.target.value)}
                    placeholder="e.g. 4-6 hours/week"
                  />
                </Form.Group>
              </div>
              <Form.Group className="mb-2">
                <Form.Checkbox checked={sequential} onChange={(e) => setSequential(e.target.checked)}>
                  Sequential (courses must be taken in order)
                </Form.Checkbox>
              </Form.Group>
              <Form.Group className="mb-2">
                <Form.Checkbox checked={inviteOnly} onChange={(e) => setInviteOnly(e.target.checked)}>
                  Invite only
                </Form.Checkbox>
              </Form.Group>
            </Card.Section>

            <Card.Section>
              <h3>Courses</h3>
              <div className="course-split-screen">
                <div className="course-split-pane">
                  <h4 className="course-split-pane-title">All Courses</h4>
                  <CourseSearchPicker
                    onAddCourse={handleAddCourse}
                    disabledCourseIds={steps.map((s) => s.courseKey)}
                  />
                </div>
                <div className="course-split-pane">
                  <h4 className="course-split-pane-title">This Learning Path ({steps.length})</h4>
                  <StepsDragList
                    steps={steps}
                    onReorder={setSteps}
                    onChangeWeight={handleChangeWeight}
                    onRemove={handleRemoveStep}
                  />
                </div>
              </div>
            </Card.Section>
          </Card.Body>
        </Card>

        <Button type="submit" variant="primary" disabled={!canSubmit}>
          {(submitting || isSaving) ? 'Saving...' : submitLabel}
        </Button>
      </Form>
    </div>
  );
};

LearningPathForm.propTypes = {
  title: PropTypes.string.isRequired,
  keyEditable: PropTypes.bool,
  fixedKey: PropTypes.string,
  submitLabel: PropTypes.string.isRequired,
  submitting: PropTypes.bool,
  onSubmit: PropTypes.func.isRequired,
  // eslint-disable-next-line react/forbid-prop-types
  initial: PropTypes.object,
};

LearningPathForm.defaultProps = {
  keyEditable: false,
  fixedKey: '',
  submitting: false,
  initial: {},
};

export default LearningPathForm;
