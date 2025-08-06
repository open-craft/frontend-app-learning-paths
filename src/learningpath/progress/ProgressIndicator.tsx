import React from 'react';
import { Icon } from '@openedx/paragon';
import { CheckCircle, Timelapse, LmsCompletionSolid } from '@openedx/paragon/icons';
import { ProgressStatus, StatusConfig } from './types';

interface ProgressIndicatorProps {
  status: ProgressStatus;
}

const ProgressIndicator: React.FC<ProgressIndicatorProps> = ({ status }) => {
  const getStatusConfig = (currentStatus: ProgressStatus): StatusConfig => {
    switch (currentStatus?.toLowerCase() as Lowercase<ProgressStatus>) {
      case 'completed':
        return {
          icon: CheckCircle,
          color: '#52854C',
          altText: 'Completed',
        };
      case 'in progress':
        return {
          icon: Timelapse,
          color: 'var(--m-teal)',
          altText: 'In progress',
        };
      default:
        return {
          icon: LmsCompletionSolid,
          color: '#8996A0',
          altText: 'Not started',
        };
    }
  };

  const config = getStatusConfig(status);

  return (
    <Icon
      src={config.icon}
      aria-label={`Progress status: ${config.altText}`}
      style={{
        color: `${config.color}`,
        height: '36px',
        width: '36px',
        zIndex: 2,
      }}
    />
  );
};

export default ProgressIndicator;
