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
  estimatedPages: number;
  recommendation: string;
}

export interface UserSettings {
  topic: string;
  bwPrice: number;
  colorPrice: number;
  budget: number;
}