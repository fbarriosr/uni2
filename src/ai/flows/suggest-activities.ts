// src/ai/flows/suggest-activities.ts
'use server';
/**
 * @fileOverview A personalized activity suggestion AI agent.
 *
 * - suggestActivities - A function that handles the activity suggestion process.
 * - SuggestActivitiesInput - The input type for the suggestActivities function.
 * - SuggestActivitiesOutput - The return type for the suggestActivities function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const SuggestActivitiesInputSchema = z.object({
  pastRatings: z
    .string()
    .describe(
      'A stringified JSON array of past activity ratings. Each rating should include activity details and a rating score.'
    ),
  location: z.string().describe('The current location of the user.'),
  availableTime: z
    .string()
    .describe('The amount of time the user has available, e.g., \'2 hours\'.'),
});
export type SuggestActivitiesInput = z.infer<typeof SuggestActivitiesInputSchema>;

const SuggestActivitiesOutputSchema = z.object({
  suggestions: z
    .string()
    .describe(
      'A stringified JSON array of activity suggestions tailored to the user\'s preferences, location, and available time.'
    ),
});
export type SuggestActivitiesOutput = z.infer<typeof SuggestActivitiesOutputSchema>;

export async function suggestActivities(input: SuggestActivitiesInput): Promise<SuggestActivitiesOutput> {
  return suggestActivitiesFlow(input);
}

const prompt = ai.definePrompt({
  name: 'suggestActivitiesPrompt',
  input: {schema: SuggestActivitiesInputSchema},
  output: {schema: SuggestActivitiesOutputSchema},
  prompt: `You are a personalized activity suggestion agent. You will take into account the user's past ratings, their current location, and the amount of time they have available to suggest activities that they would enjoy.

Past Ratings: {{{pastRatings}}}
Location: {{{location}}}
Available Time: {{{availableTime}}}

Suggest activities in a stringified JSON array format.
`,
});

const suggestActivitiesFlow = ai.defineFlow(
  {
    name: 'suggestActivitiesFlow',
    inputSchema: SuggestActivitiesInputSchema,
    outputSchema: SuggestActivitiesOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
