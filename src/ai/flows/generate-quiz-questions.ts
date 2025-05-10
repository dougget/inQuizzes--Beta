// src/ai/flows/generate-quiz-questions.ts
'use server';

/**
 * @fileOverview Generates multiple-choice questions from a document using AI.
 *
 * - generateQuizQuestions - A function that generates quiz questions from a document.
 * - GenerateQuizQuestionsInput - The input type for the generateQuizQuestions function.
 * - GenerateQuizQuestionsOutput - The return type for the generateQuizQuestions function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GenerateQuizQuestionsInputSchema = z.object({
  documentContent: z
    .string()
    .describe('The content of the document to generate questions from.'),
});
export type GenerateQuizQuestionsInput = z.infer<typeof GenerateQuizQuestionsInputSchema>;

const GenerateQuizQuestionsOutputSchema = z.object({
  questions: z.array(
    z.object({
      question: z.string().describe('The multiple-choice question.'),
      options: z.array(z.string()).describe('The possible answer options.'),
      correctAnswer: z.string().describe('The correct answer to the question.'),
      explanation: z.string().describe('The explanation of why the answer is correct.'),
    })
  ).
describe('An array of multiple-choice questions, their options, correct answers, and explanations.'),
});
export type GenerateQuizQuestionsOutput = z.infer<typeof GenerateQuizQuestionsOutputSchema>;

export async function generateQuizQuestions(input: GenerateQuizQuestionsInput): Promise<GenerateQuizQuestionsOutput> {
  return generateQuizQuestionsFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateQuizQuestionsPrompt',
  input: {schema: GenerateQuizQuestionsInputSchema},
  output: {schema: GenerateQuizQuestionsOutputSchema},
  prompt: `You are a quiz generator that creates multiple-choice questions with 4 options, a correct answer, and an explanation for the correct answer based on a document.

  Generate 25 multiple-choice questions based on the content of the document, including the correct answers and explanations.

  Document content: {{{documentContent}}}

  Ensure that the output is a valid JSON object that conforms to the schema.`,
});

const generateQuizQuestionsFlow = ai.defineFlow(
  {
    name: 'generateQuizQuestionsFlow',
    inputSchema: GenerateQuizQuestionsInputSchema,
    outputSchema: GenerateQuizQuestionsOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
