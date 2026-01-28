// Supabase Database Types
// Auto-generated types for TypeScript integration

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          email: string | null;
          phone: string | null;
          name: string;
          avatar_url: string | null;
          role: 'CAREGIVER' | 'PATIENT' | 'FAMILY_MEMBER';
          uid: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          email?: string | null;
          phone?: string | null;
          name?: string;
          avatar_url?: string | null;
          role?: 'CAREGIVER' | 'PATIENT' | 'FAMILY_MEMBER';
          uid?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          email?: string | null;
          phone?: string | null;
          name?: string;
          avatar_url?: string | null;
          role?: 'CAREGIVER' | 'PATIENT' | 'FAMILY_MEMBER';
          uid?: string | null;
          updated_at?: string;
        };
      };
      family_members: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          phone: string;
          role: 'CAREGIVER' | 'PATIENT' | 'FAMILY_MEMBER';
          avatar_url: string | null;
          is_owner: boolean;
          relation: string | null;
          age: number | null;
          gender: 'Male' | 'Female' | null;
          condition: string | null;
          linked_profile_id: string | null;
          invitation_status: 'none' | 'pending' | 'accepted' | 'declined';
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          name: string;
          phone?: string;
          role?: 'CAREGIVER' | 'PATIENT' | 'FAMILY_MEMBER';
          avatar_url?: string | null;
          is_owner?: boolean;
          relation?: string | null;
          age?: number | null;
          gender?: 'Male' | 'Female' | null;
          condition?: string | null;
          linked_profile_id?: string | null;
          invitation_status?: 'none' | 'pending' | 'accepted' | 'declined';
        };
        Update: {
          name?: string;
          phone?: string;
          role?: 'CAREGIVER' | 'PATIENT' | 'FAMILY_MEMBER';
          avatar_url?: string | null;
          is_owner?: boolean;
          relation?: string | null;
          age?: number | null;
          gender?: 'Male' | 'Female' | null;
          condition?: string | null;
          linked_profile_id?: string | null;
          invitation_status?: 'none' | 'pending' | 'accepted' | 'declined';
        };
      };
      family_invitations: {
        Row: {
          id: string;
          inviter_id: string;
          invitee_identifier: string;
          invited_role: 'CAREGIVER' | 'PATIENT' | 'FAMILY_MEMBER';
          status: 'pending' | 'accepted' | 'declined' | 'expired';
          family_member_id: string | null;
          created_at: string;
          expires_at: string;
        };
        Insert: {
          id?: string;
          inviter_id: string;
          invitee_identifier: string;
          invited_role: 'CAREGIVER' | 'PATIENT' | 'FAMILY_MEMBER';
          status?: 'pending' | 'accepted' | 'declined' | 'expired';
          family_member_id?: string | null;
        };
        Update: {
          status?: 'pending' | 'accepted' | 'declined' | 'expired';
          family_member_id?: string | null;
        };
      };
      patient_ai_settings: {
        Row: {
          id: string;
          patient_profile_id: string;
          voice_gender: 'Male' | 'Female';
          ai_bio: string;
          preferred_topics: string[];
          common_questions: { id: string; question: string; answer: string }[];
          chat_style: string | null;
          patient_self_description: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          patient_profile_id: string;
          voice_gender?: 'Male' | 'Female';
          ai_bio?: string;
          preferred_topics?: string[];
          common_questions?: { id: string; question: string; answer: string }[];
          chat_style?: string | null;
          patient_self_description?: string | null;
        };
        Update: {
          patient_profile_id?: string;
          voice_gender?: 'Male' | 'Female';
          ai_bio?: string;
          preferred_topics?: string[];
          common_questions?: { id: string; question: string; answer: string }[];
          chat_style?: string | null;
          patient_self_description?: string | null;
        };
      };
      assets: {
        Row: {
          id: string;
          user_id: string;
          title: string;
          duration: string;
          type: string;
          subtype: string | null;
          category: string;
          quiz_data: Json | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          title: string;
          duration?: string;
          type: string;
          subtype?: string | null;
          category: string;
          quiz_data?: Json | null;
        };
        Update: {
          title?: string;
          duration?: string;
          type?: string;
          subtype?: string | null;
          category?: string;
          quiz_data?: Json | null;
        };
      };
      tasks: {
        Row: {
          id: string;
          user_id: string;
          patient_profile_id: string | null;
          title: string;
          start_time: string | null;
          end_time: string | null;
          repeat: string;
          custom_days: string[];
          is_completed: boolean;
          automation_enabled: boolean;
          auto_duration: number | null;
          asset_weights: Json | null;
          assigned_to: string;
          voice_reminder: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          patient_profile_id?: string | null;
          title: string;
          start_time?: string | null;
          end_time?: string | null;
          repeat?: string;
          custom_days?: string[];
          is_completed?: boolean;
          automation_enabled?: boolean;
          auto_duration?: number | null;
          asset_weights?: Json | null;
          assigned_to?: string;
          voice_reminder?: boolean;
        };
        Update: {
          patient_profile_id?: string | null;
          title?: string;
          start_time?: string | null;
          end_time?: string | null;
          repeat?: string;
          custom_days?: string[];
          is_completed?: boolean;
          automation_enabled?: boolean;
          auto_duration?: number | null;
          asset_weights?: Json | null;
          assigned_to?: string;
          voice_reminder?: boolean;
        };
      };
      task_assets: {
        Row: {
          id: string;
          task_id: string;
          asset_id: string | null;
          type: string;
          title: string;
          duration: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          task_id: string;
          asset_id?: string | null;
          type: string;
          title: string;
          duration?: number;
        };
        Update: {
          type?: string;
          title?: string;
          duration?: number;
        };
      };
      posts: {
        Row: {
          id: string;
          author_id: string;
          title: string;
          content: string;
          image_url: string | null;
          likes_count: number;
          views_count: number;
          tags: string[];
          type: 'Story' | 'Question' | 'Tip' | 'Task';
          attached_task: string | null;
          content_images: string[];
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          author_id: string;
          title: string;
          content: string;
          image_url?: string | null;
          likes_count?: number;
          views_count?: number;
          tags?: string[];
          type?: 'Story' | 'Question' | 'Tip' | 'Task';
          attached_task?: string | null;
          content_images?: string[];
        };
        Update: {
          title?: string;
          content?: string;
          image_url?: string | null;
          likes_count?: number;
          views_count?: number;
          tags?: string[];
          type?: 'Story' | 'Question' | 'Tip' | 'Task';
          attached_task?: string | null;
          content_images?: string[];
        };
      };
      post_likes: {
        Row: {
          id: string;
          post_id: string;
          user_id: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          post_id: string;
          user_id: string;
        };
        Update: never;
      };
      chat_messages: {
        Row: {
          id: string;
          user_id: string;
          message: string;
          sender: 'user' | 'ai';
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          message: string;
          sender: 'user' | 'ai';
        };
        Update: never;
      };
    };
  };
}

// Convenience type aliases
export type Profile = Database['public']['Tables']['profiles']['Row'];
export type FamilyMemberDB = Database['public']['Tables']['family_members']['Row'];
export type FamilyInvitationDB = Database['public']['Tables']['family_invitations']['Row'];
export type PatientAISettingsDB = Database['public']['Tables']['patient_ai_settings']['Row'];
export type AssetDB = Database['public']['Tables']['assets']['Row'];
export type TaskDB = Database['public']['Tables']['tasks']['Row'];
export type TaskAssetDB = Database['public']['Tables']['task_assets']['Row'];
export type PostDB = Database['public']['Tables']['posts']['Row'];
export type ChatMessageDB = Database['public']['Tables']['chat_messages']['Row'];
