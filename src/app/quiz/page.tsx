"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useQuiz, type QuizQuestionUserAnswer } from '@/context/quiz-context';
import { generateQuizQuestions, type GenerateQuizQuestionsInput } from '@/ai/flows/generate-quiz-questions';
import { useMutation } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import { ChevronLeft, ChevronRight, CheckCircle2, XCircle, AlertTriangle, RotateCcw } from 'lucide-react';
import { ThemeToggleButton } from '@/components/layout/theme-toggle-button';
import Image from 'next/image';

export default function QuizPage() {
  const router = useRouter();
  const { 
    documentContent, 
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
    resetQuiz
  } = useQuiz();

  const [selectedAnswer, setSelectedAnswer] = useState<string | undefined>(undefined);
  const [showFeedback, setShowFeedback] = useState(false);

  const { mutate: fetchQuestions, isPending: isLoadingQuestions } = useMutation({
    mutationFn: async (input: GenerateQuizQuestionsInput) => generateQuizQuestions(input),
    onSuccess: (data) => {
      const formattedQuestions = data.questions.map(q => ({ ...q, userAnswer: undefined, isCorrect: undefined }));
      setQuestions(formattedQuestions);
      setQuizState('active');
    },
    onError: (error) => {
      console.error("Failed to generate questions:", error);
      setQuizState('idle'); // Or an error state
      // Potentially navigate back or show error message
      router.push('/'); // Simple redirect for now
    },
  });

  useEffect(() => {
    if (quizState === 'loading' && documentContent && questions.length === 0) {
      fetchQuestions({ documentContent });
    } else if (!documentContent && quizState !== 'idle') {
      // If no document content, redirect to home. This can happen on page refresh.
      router.replace('/');
    }
  }, [quizState, documentContent, questions.length, fetchQuestions, router]);

  useEffect(() => {
    // When question changes, reset selection and feedback
    setSelectedAnswer(userAnswers[currentQuestionIndex]);
    setShowFeedback(!!userAnswers[currentQuestionIndex]); // Show feedback if already answered
  }, [currentQuestionIndex, userAnswers]);


  const currentQ = questions[currentQuestionIndex];

  const handleAnswerSelection = (answer: string) => {
    if (showFeedback) return; // Don't allow changing answer after feedback is shown
    setSelectedAnswer(answer);
  };

  const handleSubmitAnswer = () => {
    if (!selectedAnswer || !currentQ) return;

    const isCorrect = selectedAnswer === currentQ.correctAnswer;
    setShowFeedback(true);
    
    const updatedAnswers = { ...userAnswers, [currentQuestionIndex]: selectedAnswer };
    setUserAnswers(updatedAnswers);

    const updatedQuestions = questions.map((q, idx) => 
      idx === currentQuestionIndex ? { ...q, userAnswer: selectedAnswer, isCorrect } : q
    );
    setQuestions(updatedQuestions);

    if (isCorrect) {
      setScore(score + 1);
    }
  };

  const handleNextQuestion = () => {
    if (!showFeedback && selectedAnswer) { // If answer selected but not submitted, submit it first
      handleSubmitAnswer();
    }
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
      setSelectedAnswer(undefined); // Reset for next question
      setShowFeedback(false);
    } else {
      setQuizState('finished');
      router.push('/quiz/results');
    }
  };

  const handlePreviousQuestion = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1);
      setSelectedAnswer(undefined); // Reset for prev question
      setShowFeedback(false);
    }
  };
  
  const handleRestartQuiz = () => {
    resetQuiz();
    router.push('/');
  };

  if (isLoadingQuestions || quizState === 'loading') {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4">
        <Card className="w-full max-w-2xl">
          <CardHeader>
            <CardTitle>Generating Quiz...</CardTitle>
            <CardDescription>AI is working its magic. Please wait a moment.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Skeleton className="h-8 w-3/4" />
            <Skeleton className="h-6 w-full" />
            <Skeleton className="h-6 w-5/6" />
            <Skeleton className="h-6 w-full" />
            <Skeleton className="h-6 w-4/6" />
            <Progress value={50} className="w-full mt-4 animate-pulse" />
          </CardContent>
        </Card>
      </div>
    );
  }

  if (quizState !== 'active' || !currentQ) {
     return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4">
        <Card className="w-full max-w-md text-center">
          <CardHeader>
            <CardTitle className="text-2xl">Quiz Not Ready</CardTitle>
            <CardDescription>There was an issue loading the quiz, or no document was provided.</CardDescription>
          </CardHeader>
          <CardContent>
            <AlertTriangle className="w-16 h-16 text-destructive mx-auto mb-4" />
            <p>Please try uploading your document again.</p>
          </CardContent>
          <CardFooter>
            <Button onClick={handleRestartQuiz} className="w-full">
              <RotateCcw className="mr-2 h-4 w-4" /> Go to Upload
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  const progressPercentage = ((currentQuestionIndex + 1) / questions.length) * 100;

  return (
    <main className="flex min-h-screen flex-col items-center p-4 sm:p-8 bg-gradient-to-br from-background to-secondary/30 dark:from-background dark:to-secondary/10">
       <div className="absolute top-4 right-4 z-10">
        <ThemeToggleButton />
      </div>
       <div className="w-full max-w-4xl mb-6">
          <div className="flex justify-center items-center mb-2">
            <Image src="/quizify-logo.svg" alt="Quizify Logo" width={40} height={40} data-ai-hint="quiz education" />
            <h1 className="text-2xl font-bold text-primary ml-2">Quizify</h1>
          </div>
          <Progress value={progressPercentage} className="w-full h-3 [&>div]:bg-primary" />
          <p className="text-sm text-muted-foreground mt-1 text-center">Question {currentQuestionIndex + 1} of {questions.length}</p>
      </div>

      <Card className="w-full max-w-4xl shadow-2xl rounded-xl overflow-hidden">
        <CardHeader className="bg-primary/10 dark:bg-primary/20 p-6">
          <CardTitle className="text-2xl font-semibold text-primary">
            {currentQ.question}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <RadioGroup
            value={selectedAnswer}
            onValueChange={handleAnswerSelection}
            className="space-y-3"
            disabled={showFeedback}
          >
            {currentQ.options.map((option, index) => {
              const isCorrectOption = option === currentQ.correctAnswer;
              const isSelectedOption = option === selectedAnswer;
              
              let optionStyle = "border-border hover:border-primary";
              if (showFeedback) {
                if (isCorrectOption) {
                  optionStyle = "border-accent bg-accent/10 text-accent-foreground";
                } else if (isSelectedOption && !isCorrectOption) {
                  optionStyle = "border-destructive bg-destructive/10 text-destructive-foreground";
                } else {
                  optionStyle = "border-border opacity-70";
                }
              } else if (isSelectedOption) {
                optionStyle = "border-primary ring-2 ring-primary";
              }

              return (
                <Label
                  key={index}
                  htmlFor={`option-${index}`}
                  className={`flex items-center space-x-3 p-4 border rounded-md cursor-pointer transition-all ${optionStyle}`}
                >
                  <RadioGroupItem value={option} id={`option-${index}`} className="shrink-0" />
                  <span className="text-base">{option}</span>
                  {showFeedback && isCorrectOption && <CheckCircle2 className="ml-auto h-5 w-5 text-accent" />}
                  {showFeedback && isSelectedOption && !isCorrectOption && <XCircle className="ml-auto h-5 w-5 text-destructive" />}
                </Label>
              );
            })}
          </RadioGroup>

          {showFeedback && (
            <Alert className={`mt-6 ${currentQ.isCorrect ? 'border-accent bg-accent/5' : 'border-destructive bg-destructive/5'}`}>
              {currentQ.isCorrect ? <CheckCircle2 className="h-5 w-5 text-accent" /> : <XCircle className="h-5 w-5 text-destructive" />}
              <AlertTitle className={`font-semibold ${currentQ.isCorrect ? 'text-accent' : 'text-destructive'}`}>
                {currentQ.isCorrect ? 'Correct!' : 'Incorrect.'}
              </AlertTitle>
              <AlertDescription className="text-foreground">
                {currentQ.explanation}
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
        <CardFooter className="flex flex-col sm:flex-row justify-between p-6 bg-secondary/30 dark:bg-secondary/10">
          <Button 
            variant="outline" 
            onClick={handlePreviousQuestion} 
            disabled={currentQuestionIndex === 0}
            className="mb-2 sm:mb-0 w-full sm:w-auto"
          >
            <ChevronLeft className="mr-2 h-4 w-4" /> Previous
          </Button>
          {!showFeedback && selectedAnswer ? (
             <Button onClick={handleSubmitAnswer} className="w-full sm:w-auto bg-primary hover:bg-primary/90">
              Submit Answer
            </Button>
          ) : (
            <Button 
              onClick={handleNextQuestion} 
              disabled={!selectedAnswer && !showFeedback} // Disable if no answer selected OR if feedback not yet shown (unless already answered)
              className="w-full sm:w-auto bg-primary hover:bg-primary/90"
            >
              {currentQuestionIndex === questions.length - 1 ? 'Finish Quiz' : 'Next Question'}
              {currentQuestionIndex < questions.length - 1 && <ChevronRight className="ml-2 h-4 w-4" />}
            </Button>
          )}
        </CardFooter>
      </Card>
       <Button variant="link" onClick={handleRestartQuiz} className="mt-8 text-muted-foreground hover:text-primary">
          <RotateCcw className="mr-2 h-4 w-4" /> Start New Quiz
        </Button>
    </main>
  );
}
