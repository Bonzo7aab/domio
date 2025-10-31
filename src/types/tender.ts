export type TenderStatus = 'draft' | 'active' | 'evaluation' | 'awarded' | 'cancelled';

export interface Tender {
  id: string;
  title: string;
  description: string;
  category: string;
  location: string;
  estimatedValue: string;
  currency: string;
  status: TenderStatus;
  createdBy: string;
  createdAt: Date;
  submissionDeadline: Date;
  evaluationDeadline?: Date;
  bidCount: number;
  winningBidId?: string;
  winnerName?: string;
  requirements: string[];
  documents: Array<{
    id: string;
    name: string;
    type: 'specification' | 'requirements' | 'drawings' | 'other';
    url: string;
    size: number;
    uploadedAt: Date;
  }>;
  evaluationCriteria: Array<{
    id: string;
    name: string;
    description: string;
    weight: number;
    type: 'price' | 'quality' | 'time' | 'experience';
  }>;
  isPublic: boolean;
}

export interface TenderDocument {
  id: string;
  name: string;
  type: 'specification' | 'requirements' | 'drawings' | 'other';
  url: string;
  size: number;
  uploadedAt: Date;
}

export interface EvaluationCriteria {
  id: string;
  name: string;
  description: string;
  weight: number;
  type: 'price' | 'quality' | 'time' | 'experience';
}
