export interface Joke {
  id: string;
  text: string;
  created_at: Date;
  updated_at: Date;
  metadata: Record<string, any>;
  user_id?: string;
  is_archived: boolean;
}

export interface Bit {
  id: string;
  label: string;
  created_at: Date;
  updated_at: Date;
  metadata: Record<string, any>;
  user_id?: string;
  is_archived: boolean;
  jokes?: Joke[];
}

export interface BitJoke {
  bit_id: string;
  joke_id: string;
  order_index: number;
  created_at: Date;
}

export interface User {
  id: string;
  email: string;
  password_hash: string;
  created_at: Date;
  updated_at: Date;
  metadata: Record<string, any>;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
} 