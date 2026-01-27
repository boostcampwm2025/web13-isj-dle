export type DailyScrumQuestion = {
  id: number;
  question: string;
};

export type RetrospectiveTemplate = {
  id: number;
  content: string;
  theme: string;
};

export enum MeetingEventType {
  DAILY_SCRUM_QUESTION_SYNC = "daily-scrum-question:sync",
  DAILY_SCRUM_QUESTION_UPDATE = "daily-scrum-question:update",
  DAILY_SCRUM_QUESTION_RESET = "daily-scrum-question:reset",

  RETROSPECTIVE_TEMPLATE_SYNC = "retrospective-template:sync",
  RETROSPECTIVE_TEMPLATE_UPDATE = "retrospective-template:update",
  RETROSPECTIVE_TEMPLATE_RESET = "retrospective-template:reset",
}

export type ResetRequest = {
  roomId: string;
};

export type RandomDailyScrumQuestionRequest = {
  roomId: string;
  num: number;
};

export type RandomRetrospectiveTemplateRequest = {
  roomId: string;
};

export type RandomDailyScrumQuestionsResponse = {
  questions: DailyScrumQuestion[];
};

export type RandomRetrospectiveTemplateResponse = {
  template: RetrospectiveTemplate | null;
};
