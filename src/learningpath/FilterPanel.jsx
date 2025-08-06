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
  selectedDateStatuses,
  onChangeDateStatus,
  selectedOrgs,
  onChangeOrg,
  organizations,
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
        onClick={onClose}
        className="position-absolute"
        alt="Close filter"
        isActive
        style={{
          top: '2.3rem',
          right: isSmall ? '1rem' : '-18px',
          zIndex: 1000,
          width: '36px',
          height: '36px',
          backgroundColor: isSmall ? 'transparent' : 'var(--icon-blue)',
          color: isSmall ? 'black' : 'white',
        }}
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
      <Form.Group>
        <Form.Label className="h4 my-3">My Progress</Form.Label>
        <Form.CheckboxSet
          name="progress-status"
          onChange={e => onChangeStatus(e.target.value, e.target.checked)}
          value={selectedStatuses}
        >
          <Form.Checkbox value="In progress" className="font-weight-light">In progress</Form.Checkbox>
          <Form.Checkbox value="Not started" className="font-weight-light">Not started</Form.Checkbox>
          <Form.Checkbox value="Completed" className="font-weight-light">Completed</Form.Checkbox>
        </Form.CheckboxSet>
      </Form.Group>
    </div>

    {/* Date Status Checkboxes */}
    <div className="my-3">
      <Form.Group>
        <Form.Label className="h4 my-3">Course / Learning Path Status</Form.Label>
        <Form.CheckboxSet
          name="date-status"
          onChange={e => onChangeDateStatus(e.target.value, e.target.checked)}
          value={selectedDateStatuses}
        >
          <Form.Checkbox value="Open" className="font-weight-light">Open</Form.Checkbox>
          <Form.Checkbox value="Upcoming" className="font-weight-light">Upcoming</Form.Checkbox>
          <Form.Checkbox value="Ended" className="font-weight-light">Ended</Form.Checkbox>
        </Form.CheckboxSet>
      </Form.Group>
    </div>

    {/* Organization Checkboxes */}
    {organizations && Object.keys(organizations).length > 0 && (
      <div className="my-3">
        <Form.Group>
          <Form.Label className="h4 my-3">Program Type</Form.Label>
          <Form.CheckboxSet
            name="organization"
            onChange={e => onChangeOrg(e.target.value, e.target.checked)}
            value={selectedOrgs}
          >
            {Object.entries(organizations).map(([shortName, org]) => (
              <Form.Checkbox key={shortName} value={shortName} className="font-weight-light">
                {org.name || shortName}
              </Form.Checkbox>
            ))}
          </Form.CheckboxSet>
        </Form.Group>
      </div>
    )}

    {/* Action Buttons */}
    {isSmall && (
      <ButtonGroup className="pb-4 filter-actions">
        <Button variant="outline-secondary" onClick={onClearAll}>Clear all</Button>
        <Button variant="primary" onClick={onClose} className="pl-3">Apply</Button>
      </ButtonGroup>
    )}
  </div>
);

FilterPanel.propTypes = {
  selectedContentType: PropTypes.oneOf(['All', 'course', 'learning_path']).isRequired,
  onSelectContentType: PropTypes.func.isRequired,
  selectedStatuses: PropTypes.arrayOf(PropTypes.string).isRequired,
  onChangeStatus: PropTypes.func.isRequired,
  selectedDateStatuses: PropTypes.arrayOf(PropTypes.string).isRequired,
  onChangeDateStatus: PropTypes.func.isRequired,
  selectedOrgs: PropTypes.arrayOf(PropTypes.string).isRequired,
  onChangeOrg: PropTypes.func.isRequired,
  organizations: PropTypes.objectOf(
    PropTypes.shape({
      name: PropTypes.string,
      shortName: PropTypes.string,
    }),
  ).isRequired,
  onClose: PropTypes.func.isRequired,
  isSmall: PropTypes.bool.isRequired,
  onClearAll: PropTypes.func.isRequired,
};

export default FilterPanel;
