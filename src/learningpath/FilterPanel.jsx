// src/learningpath/components/FilterPanel.js
import React from 'react';
import {
  Button, ButtonGroup, Form, Icon,
} from '@openedx/paragon';
import { FilterList } from '@openedx/paragon/icons';

const FilterPanel = ({
  selectedContentType,
  onSelectContentType,
  selectedStatuses,
  onChangeStatus,
  onClose,
}) => (
  <div className="p-3">
    <div className="d-flex justify-content-between align-items-center mb-3">
      <h4>Filter</h4>
      <Button variant="link" onClick={onClose}>
        <Icon src={FilterList} />
      </Button>
    </div>

    {/* Content Type Tabs */}
    <div className="my-3">
      <ButtonGroup>
        <Button
          variant={selectedContentType === 'All' ? 'primary' : 'outline-secondary'}
          onClick={() => onSelectContentType('All')}
          active={selectedContentType === 'All'}
        >
          All
        </Button>
        <Button
          variant={selectedContentType === 'course' ? 'primary' : 'outline-secondary'}
          onClick={() => onSelectContentType('course')}
          active={selectedContentType === 'course'}
        >
          Courses
        </Button>
        <Button
          variant={selectedContentType === 'learning_path' ? 'primary' : 'outline-secondary'}
          onClick={() => onSelectContentType('learning_path')}
          active={selectedContentType === 'learning_path'}
        >
          Learning Paths
        </Button>
      </ButtonGroup>
    </div>

    {/* Status Checkboxes */}
    <div className="my-3">
      <h5>Status</h5>
      <Form>
        <div className="status-options">
          <Form.Checkbox
            value="In Progress"
            checked={selectedStatuses.includes('In Progress')}
            onChange={e => onChangeStatus('In Progress', e.target.checked)}
          >
            In progress
          </Form.Checkbox>
          <Form.Checkbox
            value="Not started"
            checked={selectedStatuses.includes('Not started')}
            onChange={e => onChangeStatus('Not started', e.target.checked)}
          >
            Not started
          </Form.Checkbox>
          <Form.Checkbox
            value="Completed"
            checked={selectedStatuses.includes('Completed')}
            onChange={e => onChangeStatus('Completed', e.target.checked)}
          >
            Completed
          </Form.Checkbox>
        </div>
      </Form>
    </div>
  </div>
);

export default FilterPanel;
