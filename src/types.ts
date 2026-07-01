export interface VariantQuestion {
  id: number;
  questionText: string;
  answer: string;
  explanation: string;
}

export interface WrongQuestion {
  id: string;
  originalText: string;
  image?: string; // Data URL for the error photo (if uploaded)
  subject: string;
  knowledgePoint: string;
  difficulty: "简单" | "中等" | "困难";
  analyzedError: string;
  variants: VariantQuestion[];
  createdAt: string;
  selectedForPrint?: boolean; // Multi-select state for bulk printing
}

export type TabType = "identify" | "notebook";
