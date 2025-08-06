export type ProgressStatus = 'Completed' | 'In progress' | 'Not started';

export interface Course {
  id: string;
  name: string;
  org: string;
  courseImageAssetPath?: string;
  startDate?: string;
  endDate?: string;
  status: ProgressStatus;
  percent: number;
  progressStatus?: string;
}

export interface StatusConfig {
  icon: React.ComponentType;
  color: string;
  altText: string;
}
