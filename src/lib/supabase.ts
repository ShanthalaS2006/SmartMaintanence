import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export type UserRole = 'student' | 'admin' | 'technician';

export type IncidentCategory = 'electricity' | 'water' | 'internet' | 'hostel' | 'equipment';
export type IncidentPriority = 'low' | 'medium' | 'high' | 'critical';
export type IncidentStatus = 'reported' | 'assigned' | 'in_progress' | 'resolved' | 'closed';

export interface Profile {
  id: string;
  email: string;
  full_name: string;
  role: UserRole;
  phone?: string;
  room_number?: string;
  created_at: string;
  updated_at: string;
}

export interface Incident {
  id: string;
  title: string;
  description: string;
  category: IncidentCategory;
  priority: IncidentPriority;
  status: IncidentStatus;
  location: string;
  latitude?: number;
  longitude?: number;
  building: string;
  floor?: string;
  room?: string;
  reported_by: string;
  assigned_to?: string;
  resolved_at?: string;
  closed_at?: string;
  sla_deadline: string;
  created_at: string;
  updated_at: string;
}

export interface Notification {
  id: string;
  user_id: string;
  incident_id?: string;
  title: string;
  message: string;
  type: 'incident_update' | 'assignment' | 'resolved' | 'warning';
  is_read: boolean;
  created_at: string;
}
