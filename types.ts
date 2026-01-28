
export type ViewState = 'splash' | 'landing' | 'auth' | 'dashboard' | 'clipboard' | 'profile' | 'admin' | 'wos_chat';
export type DocType = 'expose' | 'dissertation' | 'argumentation' | 'these';
export type PlanType = 'freemium' | 'starter' | 'pro_authority';

export interface User {
  id: string;
  name: string;
  email: string;
  password?: string; // Stored in mock DB only
  plan: PlanType;
  generationsUsed: number;
  generationsLimit: number; // 6 for freemium
  isAdmin: boolean;
  avatar?: string;
  customApiKey?: string; // API Key personal del usuario
}

export interface UserSettings {
  topic: string;
  educationLevel: string;
  currency: string;
  bwPrice: number;
  colorPrice: number;
  budget: number;
  enableFormatting: boolean;
}

export interface GenerationConfig {
  type: DocType;
  topic: string; // Used for all
  level?: string;
  // Exposé specific
  currency?: string;
  bwPrice?: number;
  colorPrice?: number;
  budget?: number;
  school?: string;
  country?: string;
  professor?: string;
  date?: string;
  department?: string;
  objectives?: string; // New field
  // Dissertation specific
  citation?: string;
  // Shared
  instructions?: string;
  pageCount?: number;
  userApiKey?: string; // Clave opcional pasada desde el contexto
}

export interface Section {
  heading: string;
  subheading?: string;
  content: string;
  visualSuggestion?: string;
  isColor?: boolean;
  isImportant?: boolean;
  isCitation?: boolean;
}

export interface ExposeContent {
  title: string;
  cover?: {
    schoolLogo?: string;
    countrySymbol?: string;
    title: string;
    subtitle?: string;
    studentName: string;
    professorName?: string;
    date?: string;
    schoolName?: string;
    educationLevel?: string;
  };
  toc?: { title: string; page: number }[];
  introduction: string;
  sections: Section[];
  conclusion: string;
  bibliography?: string[];
  qa?: { question: string; answer: string }[];
  speech?: string;
  estimatedPages: number;
  recommendation?: string;
}

export interface GeneratedContent {
  id?: string;
  type: DocType;
  title: string;
  content: {
    cover?: {
      schoolLogo?: string;
      countrySymbol?: string;
      title: string;
      subtitle?: string;
      studentName: string;
      professorName?: string;
      date?: string;
      schoolName?: string;
      educationLevel?: string;
    };
    toc?: { title: string; page: number }[];
    introduction: string;
    sections: Section[];
    conclusion: string;
    bibliography?: string[];
    qa?: { question: string; answer: string }[]; // Pro+
    speech?: string; // Pro+
    estimatedPages: number;
    recommendation?: string;
  };
  createdAt: number;
  userId?: string;
}

export interface HistoryItem {
  id: string;
  timestamp: number;
  settings: UserSettings;
  content: {
    estimatedPages: number;
  };
}

export interface Notification {
  id: string;
  message: string;
  date: number;
  read: boolean;
}

export interface PromoCode {
  code: string;
  type: 'admin' | 'generations';
  value: number; // e.g. 10 generations
  active: boolean;
}

export interface AdminStats {
  totalUsers: number;
  revenue: number;
  generationsToday: number;
}
