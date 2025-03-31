export interface Joke {
  id: string;
  text: string;
  bit_id: string;
  user_id: string;
  metadata: Record<string, any>;
  is_archived: boolean;
  created_at: Date;
  updated_at: Date;
} 