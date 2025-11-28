export interface ExposeSection {
  heading: string;
  content: string;
  visualSuggestion?: string;
  isColor?: boolean;
}

export interface ExposeContent {
  title: string;
  introduction: string;
  sections: ExposeSection[];
  conclusion: string;
  bibliography: string[];
  estimatedPages: number;
  recommendation: string;
}

export interface UserSettings {
  topic: string;
  educationLevel: string;
  currency: string;
  bwPrice: number;
  colorPrice: number;
  budget: number;
}

export interface HistoryItem {
  id: string;
  timestamp: number;
  settings: UserSettings;
  content: ExposeContent;
}