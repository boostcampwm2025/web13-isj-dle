export type DailyScrumQuestion = {
  id: number;
  question: string;
};

export type RetrospectiveTemplate = {
  id: number;
  content: string;
  theme: string;
};

export type RandomDailyScrumQuestionsResponse = {
  questions: DailyScrumQuestion[];
};

export type RandomRetrospectiveTemplateResponse = {
  template: RetrospectiveTemplate | null;
};
