export enum UserRole {
  CAREGIVER = 'CAREGIVER',
  PATIENT = 'PATIENT',
  FAMILY_MEMBER = 'FAMILY_MEMBER'
}

export enum TaskType {
  GAME = 'GAME',
  QUIZ = 'QUIZ',
  AUDIO = 'AUDIO',
  VIDEO = 'VIDEO',
  PHOTO = 'PHOTO'
}

export interface TaskAsset {
  id: string;
  type: TaskType;
  title: string;
  duration: number; // in minutes
}

export interface QuizAnswer {
  id: string;
  text: string;
  isCorrect: boolean;
  image?: string;
}

export interface QuizData {
  question: string;
  questionImage?: string;
  answers: QuizAnswer[];
}

export interface Asset {
  id: string;
  title: string;
  duration: string;
  type: string;
  subtype?: string; // Optional field for specific categories (e.g. Trivia, Logic)
  quizData?: QuizData; // Optional field for Quiz assets
}

export interface AssetData {
  [key: string]: Asset[];
}

export interface TaskWeights {
  [TaskType.GAME]: number;
  [TaskType.QUIZ]: number;
  [TaskType.AUDIO]: number;
  [TaskType.VIDEO]: number;
  [TaskType.PHOTO]: number;
}

export interface FAQ {
  id: string;
  question: string;
  answer: string;
}

export interface PatientAISettings {
  voiceGender: 'Male' | 'Female';
  aiBio: string; // General persona description
  preferredTopics: string[];
  commonQuestions: FAQ[]; // Structured Q&A
  chatStyle?: string; // e.g. "Cheerful", "Formal"
  patientSelfDescription?: string; // Specific patient self-ID
}

export interface Task {
  id: string;
  title: string;
  
  // Patient association (for cross-caregiver sharing)
  patientProfileId?: string; // Links to patient's profile for shared viewing
  
  // Scheduling
  startTime: string; // HH:mm
  endTime: string;   // HH:mm
  repeat: string; // 'Daily', 'Weekly', 'Customize'
  customDays?: string[]; // Array of selected days e.g. ['Mon', 'Wed']
  
  // Automation
  isCompleted: boolean;
  automationEnabled: boolean; // The "Auto Set Mode" toggle
  autoDuration?: number; // Total duration for auto-generated tasks
  assetWeights?: TaskWeights; // Weights for auto-generation focus
  
  // Content
  assets: TaskAsset[];
  
  // Metadata
  assignedTo: string; 
  voiceReminder?: boolean;
}

export interface Patient {
  id: string;
  name: string;
  age: number;
  gender: 'Male' | 'Female';
  avatarUrl: string;
  relation: string;
  condition?: string;
}

export interface FamilyMember {
  id: string;
  name: string;
  phone: string;
  role: UserRole;
  avatarUrl: string;
  isOwner?: boolean;
  relation?: string;
  // Patient specific optional fields
  age?: number;
  gender?: 'Male' | 'Female';
  condition?: string;
  // Linked account fields
  linkedProfileId?: string;
  invitationStatus?: 'none' | 'pending' | 'accepted' | 'declined';
}

export interface FamilyInvitation {
  id: string;
  inviterId: string;
  inviterName?: string;
  inviteeIdentifier: string;
  invitedRole: UserRole;
  status: 'pending' | 'accepted' | 'declined' | 'expired';
  familyMemberId?: string;
  createdAt: Date;
  expiresAt: Date;
}

export interface UserSearchResult {
  id: string;
  uid: string;
  name: string;
  avatarUrl: string;
  role: UserRole;
  phone?: string;
}

export interface Post {
  id: string;
  author: string;
  authorAvatar: string;
  image?: string;
  title: string;
  content: string;
  likes: number;
  views: number;
  tags: string[];
  type?: 'Story' | 'Question' | 'Tip' | 'Task';
  attachedTask?: string; // Title of attached task
  contentImages?: string[]; // Images inserted in text
}

export interface ChatMessage {
  id: string;
  text: string;
  sender: 'user' | 'ai';
  timestamp: Date;
}

// Navigation types
export type RootStackParamList = {
  Auth: undefined;
  Main: undefined;
  CreateTask: { task?: Task };
  Chat: undefined;
  PatientAISettings: undefined;
  TaskList: undefined;
  Statistics: undefined;
  Assets: undefined;
};

export type MainTabParamList = {
  Home: undefined;
  Tasks: undefined;
  Community: undefined;
  Profile: undefined;
};
