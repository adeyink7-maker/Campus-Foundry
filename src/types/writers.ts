export type WriterStatus = 'pending' | 'approved' | 'rejected';

export interface WriterApplication {
  id?: string;
  user_id: string;
  status: WriterStatus;
  links: string[];
  bio: string;
  note?: string;
  created_at: string;
  reviewed_at?: string | null;
  applicantName?: string;
  applicantUsername?: string;
  applicantAvatarUrl?: string;
  applicantDepartment?: string;
}

export interface ApprovedWriterProfile {
  userId: string;
  name: string;
  username?: string;
  avatarUrl: string;
  bio: string;
  department?: string;
  university?: string;
  articlesCount: number;
  isVerified?: boolean;
}

export type WriterVerificationStatus = 'pending' | 'approved' | 'rejected' | 'expired';

export interface WriterVerification {
  id?: string;
  user_id: string;
  link: string;
  code: string;
  status: WriterVerificationStatus;
  created_at: string;
  expires_at: string;
  reviewed_at?: string | null;
  applicantName?: string;
  applicantUsername?: string;
  applicantAvatarUrl?: string;
  applicantDepartment?: string;
}
