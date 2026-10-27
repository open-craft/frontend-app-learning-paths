import React, { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import {
  Form, Spinner, IconButton, Icon,
} from '@openedx/paragon';
import { Add, Check, Search } from '@openedx/paragon/icons';
import { useCourseSearch } from '../data/queries';
import './CourseSearchPicker.scss';

const CourseSearchPicker = ({ onAddCourse, disabledCourseIds }) => {
  const [inputValue, setInputValue] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const id = setTimeout(() => setSearchTerm(inputValue.trim()), 400);
    return () => clearTimeout(id);
  }, [inputValue]);

  const { data: results, isLoading, isFetching } = useCourseSearch(searchTerm);

  return (
    <div className="course-search-picker">
      <Form.Group className="mb-3">
        <Form.Control
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          placeholder="Search courses by name or ID..."
          leadingElement={<Icon src={Search} />}
        />
      </Form.Group>

      {(isLoading || isFetching) && (
        <div className="d-flex justify-content-center py-4">
          <Spinner animation="border" size="sm" screenReaderText="Loading courses" />
        </div>
      )}

      {!isLoading && results?.length === 0 && (
        <p className="text-muted small">No courses found.</p>
      )}

      {results && results.length > 0 && (
        <div className="course-picker-grid">
          {results.map((course) => {
            const alreadyAdded = disabledCourseIds.includes(course.id);
            return (
              <button
                key={course.id}
                type="button"
                className={`course-picker-card ${alreadyAdded ? 'added' : ''}`}
                onClick={() => !alreadyAdded && onAddCourse(course)}
                disabled={alreadyAdded}
              >
                <div className="course-picker-card-body">
                  <div className="course-picker-card-title">{course.name}</div>
                  <div className="course-picker-card-id text-muted small">{course.id}</div>
                </div>
                <IconButton
                  src={alreadyAdded ? Check : Add}
                  iconAs={Icon}
                  alt={alreadyAdded ? 'Added' : 'Add'}
                  variant={alreadyAdded ? 'success' : 'primary'}
                  tabIndex={-1}
                />
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};

CourseSearchPicker.propTypes = {
  onAddCourse: PropTypes.func.isRequired,
  disabledCourseIds: PropTypes.arrayOf(PropTypes.string).isRequired,
};

export default CourseSearchPicker;
