type Exam = {
  questions: Question[];
  config: Config;
};

type Question = {
  question: string;
  options: string[];
  correctAnswer: number;
};

type Config = {
  title: string;
  description: string;
  questionCount: number;
  questionTypes: QuestionType;
  difficulty: string;
  timeLimit: number;
  class: {
    _id: string;
    name: string;
  };
};

type QuestionType = {
  multipleChoice: boolean;
  trueFalse: boolean;
  shortAnswer: boolean;
  essay: boolean;
};

type DBExam = {
  _id: string;
  title: string;
  description: string;
  questions: Question[];
  createdAt: Date;
  updatedAt: Date;
};

type DBClass = {
  id: string;
  name: string;
  exams: DBExam[];
};

export type { Exam, Question, Config, QuestionType, DBExam, DBClass };
