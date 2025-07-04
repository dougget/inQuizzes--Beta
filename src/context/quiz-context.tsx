"use client";

import type { ReactNode } from 'react';
import { createContext, useContext, useState, useMemo } from 'react';
import type { GenerateQuizQuestionsOutput } from '@/ai/flows/generate-quiz-questions';

export type QuizQuestionUserAnswer = GenerateQuizQuestionsOutput['questions'][0] & {
  userAnswer?: string;
  isCorrect?: boolean;
};

interface QuizContextType {
  documentContent: string | null;
  setDocumentContent: (content: string | null) => void;
  questions: QuizQuestionUserAnswer[];
  setQuestions: (questions: QuizQuestionUserAnswer[]) => void;
  userAnswers: Record<number, string>; 
  setUserAnswers: (answers: Record<number, string>) => void;
  currentQuestionIndex: number;
  setCurrentQuestionIndex: (index: number) => void;
  score: number;
  setScore: (score: number) => void;
  quizState: 'idle' | 'loading' | 'active' | 'finished';
  setQuizState: (state: 'idle' | 'loading' | 'active' | 'finished') => void;
  numberOfQuestions: number;
  setNumberOfQuestions: (num: number) => void;
  resetQuiz: () => void;
}

const QuizContext = createContext<QuizContextType | undefined>(undefined);

const initialState = {
  documentContent: null,
  questions: [],
  userAnswers: {},
  currentQuestionIndex: 0,
  score: 0,
  quizState: 'idle' as 'idle' | 'loading' | 'active' | 'finished',
  numberOfQuestions: 25, // Default number of questions
};

export function QuizProvider({ children }: { children: ReactNode }) {
  const [documentContent, setDocumentContentState] = useState<string | null>(initialState.documentContent);
  const [questions, setQuestionsState] = useState<QuizQuestionUserAnswer[]>(initialState.questions);
  const [userAnswers, setUserAnswersState] = useState<Record<number, string>>(initialState.userAnswers);
  const [currentQuestionIndex, setCurrentQuestionIndexState] = useState<number>(initialState.currentQuestionIndex);
  const [score, setScoreState] = useState<number>(initialState.score);
  const [quizState, setQuizStateInternal] = useState<'idle' | 'loading' | 'active' | 'finished'>(initialState.quizState);
  const [numberOfQuestions, setNumberOfQuestionsState] = useState<number>(initialState.numberOfQuestions);

  const setDocumentContent = (content: string | null) => {
    setDocumentContentState(content);
  };

  const setQuestions = (newQuestions: QuizQuestionUserAnswer[]) => {
    setQuestionsState(newQuestions);
  };

  const setUserAnswers = (answers: Record<number, string>) => {
    setUserAnswersState(answers);
  };
  
  const setCurrentQuestionIndex = (index: number) => {
    setCurrentQuestionIndexState(index);
  };

  const setScore = (newScore: number) => {
    setScoreState(newScore);
  };

  const setQuizState = (state: 'idle' | 'loading' | 'active' | 'finished') => {
    setQuizStateInternal(state);
  };

  const setNumberOfQuestions = (num: number) => {
    setNumberOfQuestionsState(num);
  };

  const resetQuiz = () => {
    setDocumentContentState(initialState.documentContent);
    setQuestionsState(initialState.questions);
    setUserAnswersState(initialState.userAnswers);
    setCurrentQuestionIndexState(initialState.currentQuestionIndex);
    setScoreState(initialState.score);
    setQuizStateInternal(initialState.quizState);
    setNumberOfQuestionsState(initialState.numberOfQuestions);
  };

  const contextValue = useMemo(() => ({
    documentContent,
    setDocumentContent,
    questions,
    setQuestions,
    userAnswers,
    setUserAnswers,
    currentQuestionIndex,
    setCurrentQuestionIndex,
    score,
    setScore,
    quizState,
    setQuizState,
    numberOfQuestions,
    setNumberOfQuestions,
    resetQuiz,
  }), [documentContent, questions, userAnswers, currentQuestionIndex, score, quizState, numberOfQuestions]);

  return (
    <QuizContext.Provider value={contextValue}>
      {children}
    </QuizContext.Provider>
  );
}

export function useQuiz() {
  const context = useContext(QuizContext);
  if (context === undefined) {
    throw new Error('useQuiz must be used within a QuizProvider');
  }
  return context;
}
