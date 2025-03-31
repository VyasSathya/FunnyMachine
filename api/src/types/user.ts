export interface User {
  id: string;
  email: string;
  password: string;
  name: string;
  metadata: Record<string, any>;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
} 