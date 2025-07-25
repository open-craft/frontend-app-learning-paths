import React from 'react';
import PropTypes from 'prop-types';
import {
  Button, ButtonGroup, Form, Icon, IconButton,
} from '@openedx/paragon';
import { FilterList, Close } from '@openedx/paragon/icons';

const FilterPanel = ({
  selectedContentType,
  onSelectContentType,
  selectedStatuses,
  onChangeStatus,
  onClose,
  isSmall,
  onClearAll,
}) => (
  <div className="pl-3 pr-3 pt-2 mt-4.5">
    <div className="d-flex justify-content-between align-items-center mb-3">
      <h4 className="mb-0">Filter</h4>
      {!isSmall && (
        <Button variant="link" onClick={onClearAll} className="pr-4 filter-clear-link">Clear all</Button>
      )}
      <IconButton
        src={isSmall ? Close : FilterList}
        iconAs={Icon}
        variant="link"
        onClick={onClose}
        className="filter-close-button"
      />
    </div>

    {/* Content Type Tabs */}
    <div className="my-3">
      <ButtonGroup className="filter-content-buttons">
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
      <h4 className="mt-4.5 mb-3">My Progress</h4>
      <Form>
        <div className="status-options">
          <Form.Checkbox
            value="In progress"
            checked={selectedStatuses.includes('In progress')}
            onChange={e => onChangeStatus('In progress', e.target.checked)}
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

    {/* Action Buttons */}
    {isSmall && (
      <ButtonGroup className="pb-4 filter-actions">
        <Button variant="outline-secondary" onClick={onClearAll}>
          Clear all
        </Button>
        <Button variant="primary" onClick={onClose} className="pl-3">
          Apply
        </Button>
      </ButtonGroup>
    )}
  </div>
);

FilterPanel.propTypes = {
  selectedContentType: PropTypes.oneOf(['All', 'course', 'learning_path']).isRequired,
  onSelectContentType: PropTypes.func.isRequired,
  selectedStatuses: PropTypes.arrayOf(PropTypes.string).isRequired,
  onChangeStatus: PropTypes.func.isRequired,
  onClose: PropTypes.func.isRequired,
  isSmall: PropTypes.bool.isRequired,
  onClearAll: PropTypes.func.isRequired,
};

export default FilterPanel;
