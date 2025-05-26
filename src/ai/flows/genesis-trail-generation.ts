
// src/ai/flows/genesis-trail-generation.ts
'use server';

/**
 * @fileOverview Generates a timeline of a project's creation history, visualized as a branching structure.
 *
 * - generateGenesisTrail - A function that generates the genesis trail and saves it.
 * - GenerateGenesisTrailWithUserInput - Input type including userId.
 * - GenesisTrailInput - The input type for the AI prompt.
 * - GenesisTrailOutput - The return type for the AI flow.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import { saveGenesisTrail } from '@/actions/genesisTrailActions'; // Added import
import { auth } from '@/lib/firebase'; // To ensure we can get current user if needed, or pass UID

const GenesisTrailInputSchema = z.object({
  projectDescription: z.string().describe('A detailed description of the project, its goals, and the creative process involved.'),
  creationEvents: z.array(
    z.object({
      timestamp: z.string().describe('The date and time of the event.'),
      description: z.string().describe('A description of the event.'),
      mediaUrl: z.string().optional().describe('Optional URL to media associated with the event.'),
    })
  ).describe('An array of creation events, each with a timestamp, description, and optional media URL.'),
});

export type GenesisTrailInput = z.infer<typeof GenesisTrailInputSchema>;

const GenerateGenesisTrailWithUserInputSchema = GenesisTrailInputSchema.extend({
  userId: z.string().describe('The ID of the user for whom the trail is being generated.')
});
export type GenerateGenesisTrailWithUserInput = z.infer<typeof GenerateGenesisTrailWithUserInputSchema>;


const GenesisTrailOutputSchema = z.object({
  timelineDescription: z.string().describe('A narrative description of the project timeline, highlighting key events and their impact on the project evolution.'),
  timelineNodes: z.array(
    z.object({
      id: z.string().describe('Unique identifier for the node.'),
      timestamp: z.string().describe('The date and time of the event.'),
      description: z.string().describe('A concise summary of the event.'),
      mediaUrl: z.string().optional().describe('Optional URL to media associated with the event.'),
      children: z.array(z.string()).describe('An array of IDs of child nodes.'),
    })
  ).describe('A structured representation of the timeline nodes, including their relationships and associated media.'),
});

export type GenesisTrailOutput = z.infer<typeof GenesisTrailOutputSchema>;

// Updated to accept userId along with other inputs for saving
export async function generateGenesisTrail(input: GenerateGenesisTrailWithUserInput): Promise<GenesisTrailOutput> {
  const { userId, ...promptInput } = input;
  const flowOutput = await generateGenesisTrailFlow(promptInput);

  if (userId && flowOutput) {
    await saveGenesisTrail(userId, promptInput, flowOutput);
  } else if (!flowOutput) {
    console.warn("Genesis Trail flow did not return output, not saving.");
  } else {
    console.warn("User ID not provided, generated Genesis Trail will not be saved.");
  }

  return flowOutput;
}

const genesisTrailPrompt = ai.definePrompt({
  name: 'genesisTrailPrompt',
  input: {schema: GenesisTrailInputSchema}, // The prompt itself doesn't need userId
  output: {schema: GenesisTrailOutputSchema},
  prompt: `You are an expert in visualizing project creation histories as branching timelines.

  Based on the provided project description and creation events, generate a timeline that captures the project's evolution.
  The timeline should highlight key events and their impact on the project.

  Project Description: {{{projectDescription}}}
  Creation Events: {{#each creationEvents}}- Timestamp: {{{timestamp}}}, Description: {{{description}}}{{#if mediaUrl}}, Media URL: {{{mediaUrl}}}{{/if}}{{/each}}

  Output a timeline that includes a narrative description and a structured representation of the timeline nodes with their relationships.
  Ensure that the timeline nodes accurately reflect the chronological order of events and the connections between them.
  Nodes MUST have unique IDs.
  Timeline nodes must have child arrays pointing to the IDs of their children.
  `,
});

const generateGenesisTrailFlow = ai.defineFlow(
  {
    name: 'generateGenesisTrailFlow',
    inputSchema: GenesisTrailInputSchema, // Flow definition uses the original input schema
    outputSchema: GenesisTrailOutputSchema,
  },
  async input => {
    const {output} = await genesisTrailPrompt(input);
    return output!;
  }
);

