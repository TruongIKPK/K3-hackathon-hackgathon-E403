export interface Slide {
  pageNumber: number;
  title: string;
  subtitle?: string;
  category?: string;
  contentLines?: string[];
  bgType: 'sage' | 'white' | 'dark' | 'card';
  instructorInfo?: {
    name: string;
    role: string;
    bioPoints: string[];
    avatarUrl: string;
  };
  keyTakeaway?: string;
  notesCount?: number;
}

export interface DocumentItem {
  id: string;
  name: string;
  pageCount: number;
  courseCode: string;
  materialRef: string;
  isStudying?: boolean;
  slides: Slide[];
}

export interface DaySection {
  id: string;
  title: string;
  docCount: number;
  isActive: boolean;
  isStudying?: boolean;
  documents: DocumentItem[];
}

export type ViewerMode = 'read' | 'pen' | 'highlight';

export interface ChatMessage {
  id: string;
  sender: 'user' | 'tutor';
  text: string;
  contextSlide?: number;
  selectedText?: string;
  timestamp: string;
}

export interface PageNote {
  id: string;
  pageNumber: number;
  content: string;
  createdAt: string;
  color?: string;
}
