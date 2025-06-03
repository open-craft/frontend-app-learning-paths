import React from 'react';
import PropTypes from 'prop-types';
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
  <div className="pl-3 pr-3 pt-2 mt-4.5">
    <div className="d-flex justify-content-between align-items-center mb-3">
      <h4>Filter</h4>
      <Button variant="link" onClick={onClose} className="filter-close-button">
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
      <h4>Status</h4>
      <Form>
        <div className="status-options">
          <Form.Checkbox
            value="In Progress"
            checked={selectedStatuses.includes('In Progress')}
            onChange={e => onChangeStatus('In Progress', e.target.checked)}
            className="font-weight-light"
          >
            In progress
          </Form.Checkbox>
          <Form.Checkbox
            value="Not started"
            checked={selectedStatuses.includes('Not started')}
            onChange={e => onChangeStatus('Not started', e.target.checked)}
            className="font-weight-light"
          >
            Not started
          </Form.Checkbox>
          <Form.Checkbox
            value="Completed"
            checked={selectedStatuses.includes('Completed')}
            onChange={e => onChangeStatus('Completed', e.target.checked)}
            className="font-weight-light"
          >
            Completed
          </Form.Checkbox>
        </div>
      </Form>
    </div>
  </div>
);

FilterPanel.propTypes = {
  selectedContentType: PropTypes.oneOf(['All', 'course', 'learning_path']).isRequired,
  onSelectContentType: PropTypes.func.isRequired,
  selectedStatuses: PropTypes.arrayOf(PropTypes.string).isRequired,
  onChangeStatus: PropTypes.func.isRequired,
  onClose: PropTypes.func.isRequired,
};

export default FilterPanel;
