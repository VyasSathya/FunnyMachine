export interface Bit {
  id: string;
  title: string;
  description: string;
  user_id: string;
  metadata: Record<string, any>;
  is_archived: boolean;
  created_at: Date;
  updated_at: Date;
} 