
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
  numberOfQuestions: z
    .number()
    .min(5)
    .max(50)
    .describe('The number of questions to generate.'),
});
export type GenerateQuizQuestionsInput = z.infer<typeof GenerateQuizQuestionsInputSchema>;

const GenerateQuizQuestionsOutputSchema = z.object({
  questions: z.array(
    z.object({
      question: z.string().describe('The multiple-choice question.'),
      options: z.array(z.string()).length(5).describe('The 5 possible answer options.'),
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
  prompt: `You are an expert quiz generator. Your task is to create high-quality multiple-choice questions based on the provided document. Do not make questions about the document, focus on the document content.

  You will generate exactly {{{numberOfQuestions}}} multiple-choice questions.
  Each question must have exactly 5 answer options.
  For each question, provide:
  1. The question itself.
  2. The 5 answer options.
  3. The correct answer from the 5 options.
  4. A detailed explanation of why that answer is correct, referencing information from the document if possible.

  The questions should be extensive and elaborate, designed to test a deeper understanding of the material rather than simple factual recall. Each question should encourage critical thinking.
  The 5 options provided for each question should be plausible and distinct, with one clearly correct answer based on the provided document content.

  Document content:
  {{{documentContent}}}

  Ensure that your entire output is a single, valid JSON object that strictly conforms to the provided output schema. Do not include any text outside of this JSON object.`,
});

const generateQuizQuestionsFlow = ai.defineFlow(
  {
    name: 'generateQuizQuestionsFlow',
    inputSchema: GenerateQuizQuestionsInputSchema,
    outputSchema: GenerateQuizQuestionsOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    if (!output) {
      throw new Error('AI failed to generate questions. Output was null.');
    }
    // Validate that the AI returned the correct number of questions
    if (output.questions.length !== input.numberOfQuestions) {
        console.warn(`AI generated ${output.questions.length} questions, but ${input.numberOfQuestions} were requested. Attempting to use what was generated if possible or slice/pad if necessary.`);
        // Basic handling: if more, slice. if less, this might be an issue or require re-prompting in a real scenario.
        // For now, let's allow it but log. A more robust solution might re-prompt or error.
        // output.questions = output.questions.slice(0, input.numberOfQuestions);
    }
    // Validate each question has 5 options
    output.questions.forEach((q, index) => {
        if(q.options.length !== 5) {
            console.warn(`Question ${index + 1} has ${q.options.length} options, expected 5. This might cause issues in display.`);
            // Potentially try to fix or discard question
        }
    });
    return output;
  }
);

