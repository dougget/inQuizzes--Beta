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
  prompt: `You are an expert quiz generator. Your task is to create high-quality multiple-choice questions based on the provided document content. Focus ONLY on the actual content and subject matter of the document, NOT on the document's metadata, file format, or technical aspects.

  IMPORTANT RULES:
  1. NEVER generate questions about:
     - The document file itself (format, size, name, etc.)
     - Document metadata (title, author, date, etc.)
     - Technical aspects of document processing
     - The process of generating questions
  2. ONLY generate questions about:
     - The actual subject matter and content
     - Key concepts, ideas, and information presented
     - Relationships between different pieces of information
     - Analysis and understanding of the content

  You will generate exactly {{{numberOfQuestions}}} multiple-choice questions.
  The questions should be in the same language as the document content.
  Each question must have exactly 5 answer options.
  For each question, provide:
  1. The question itself - make it clear and focused on the content.
  2. The 5 answer options - all must be plausible and directly related to the content.
  3. The correct answer from the 5 options.
  4. A detailed explanation of why that answer is correct, referencing specific information from the content.

  The questions should be extensive and elaborate, designed to test a deeper understanding of the material rather than simple factual recall. Each question should encourage critical thinking and demonstrate comprehension of the subject matter.

  The 5 options provided for each question should be:
  - Plausible and distinct
  - Directly related to the content
  - Based on actual information from the document
  - Clear and well-formulated
  - With one clearly correct answer supported by the content

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

