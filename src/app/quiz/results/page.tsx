"use client";

import { useRouter } from 'next/navigation';
import { useQuiz, type QuizQuestionUserAnswer } from '@/context/quiz-context';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { ScrollArea } from '@/components/ui/scroll-area';
import { CheckCircle2, XCircle, RotateCcw, Trophy, ListChecks } from 'lucide-react';
import { ThemeToggleButton } from '@/components/layout/theme-toggle-button';

const QLogo = ({ size = 48 }: { size?: number }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 64 64"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className="text-primary"
    data-ai-hint="letter Q logo"
  >
    <circle cx="32" cy="32" r="24" stroke="currentColor" strokeWidth="7"/>
    <line x1="33" y1="35" x2="50" y2="52" stroke="currentColor" strokeWidth="8" strokeLinecap="round"/>
  </svg>
);

export default function ResultsPage() {
  const router = useRouter();
  const { questions, score, userAnswers, resetQuiz, quizState } = useQuiz();

  if (quizState !== 'finished' || questions.length === 0) {
    if (typeof window !== 'undefined') {
      router.replace('/');
    }
    return ( 
      <div className="flex items-center justify-center min-h-screen">
        <p>Loading results or redirecting...</p>
      </div>
    );
  }

  const totalQuestions = questions.length;
  const scorePercentage = totalQuestions > 0 ? Math.round((score / totalQuestions) * 100) : 0;

  const getOptionClass = (option: string, question: QuizQuestionUserAnswer) => {
    const isCorrect = option === question.correctAnswer;
    const isUserChoice = option === question.userAnswer;

    if (isCorrect) return "text-accent font-semibold";
    if (isUserChoice && !isCorrect) return "text-destructive line-through";
    return "text-muted-foreground";
  };
  
  const handleStartNewQuiz = () => {
    resetQuiz();
    router.push('/');
  };

  return (
    <main className="flex min-h-screen flex-col items-center p-4 sm:p-8 bg-gradient-to-br from-background to-secondary/30 dark:from-background dark:to-secondary/10">
      <div className="absolute top-4 right-4 z-10">
        <ThemeToggleButton />
      </div>
       <div className="flex justify-center items-center mb-4">
         <QLogo size={48} />
         <h1 className="text-3xl font-bold text-primary ml-3">inQuizzes Results</h1>
      </div>

      <Card className="w-full max-w-3xl shadow-2xl rounded-xl overflow-hidden">
        <CardHeader className="text-center bg-primary/10 dark:bg-primary/20 p-6">
          <Trophy className="w-20 h-20 text-accent mx-auto mb-4" />
          <CardTitle className="text-4xl font-bold text-primary">Quiz Completed!</CardTitle>
          <CardDescription className="text-xl text-muted-foreground mt-2">
            You scored <strong className="text-accent">{score}</strong> out of <strong className="text-foreground">{totalQuestions}</strong> ({scorePercentage}%)
          </CardDescription>
        </CardHeader>
        <CardContent className="p-6">
          <h2 className="text-2xl font-semibold mb-4 text-center text-foreground flex items-center justify-center">
            <ListChecks className="mr-3 h-7 w-7 text-primary" />
            Detailed Summary
          </h2>
          <ScrollArea className="h-[400px] pr-4">
            <Accordion type="single" collapsible className="w-full">
              {questions.map((q, index) => (
                <AccordionItem value={`item-${index}`} key={index} className="mb-2 border dark:border-gray-700 rounded-lg shadow-sm">
                  <AccordionTrigger className="p-4 hover:bg-secondary/50 dark:hover:bg-secondary/20 rounded-t-lg text-left">
                    <div className="flex items-center w-full">
                      {q.isCorrect ? (
                        <CheckCircle2 className="h-5 w-5 text-accent mr-3 shrink-0" />
                      ) : (
                        <XCircle className="h-5 w-5 text-destructive mr-3 shrink-0" />
                      )}
                      <span className="flex-grow text-base font-medium text-foreground">Question {index + 1}: {q.question.length > 60 ? q.question.substring(0, 60) + "..." : q.question}</span>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="p-4 space-y-3 bg-background dark:bg-card rounded-b-lg">
                    <p className="text-sm text-foreground"><strong>Your answer:</strong> <span className={getOptionClass(q.userAnswer || "Not answered", q)}>{q.userAnswer || "Not answered"}</span></p>
                    <p className="text-sm text-foreground"><strong>Correct answer:</strong> <span className="text-accent font-semibold">{q.correctAnswer}</span></p>
                    <p className="text-sm text-muted-foreground mt-1"><strong>Explanation:</strong> {q.explanation}</p>
                    <ul className="text-sm list-disc pl-5 mt-2 space-y-1">
                      {q.options.map(opt => (
                        <li key={opt} className={getOptionClass(opt, q)}>
                          {opt}
                           {opt === q.correctAnswer && <span className="text-accent ml-1">(Correct)</span>}
                           {opt === q.userAnswer && opt !== q.correctAnswer && <span className="text-destructive ml-1">(Your choice)</span>}
                        </li>
                      ))}
                    </ul>
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </ScrollArea>
        </CardContent>
        <CardFooter className="p-6 bg-secondary/30 dark:bg-secondary/10">
          <Button onClick={handleStartNewQuiz} className="w-full text-lg py-3 bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg shadow-md">
            <RotateCcw className="mr-2 h-5 w-5" /> Start New Quiz
          </Button>
        </CardFooter>
      </Card>
       <footer className="mt-8 text-center text-sm text-muted-foreground">
        <p>&copy; {new Date().getFullYear()} inQuizzes. Keep learning!</p>
      </footer>
    </main>
  );
}
