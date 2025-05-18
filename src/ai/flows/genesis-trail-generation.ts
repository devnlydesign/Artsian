// src/ai/flows/genesis-trail-generation.ts
'use server';

/**
 * @fileOverview Generates a timeline of a project's creation history, visualized as a branching structure.
 *
 * - generateGenesisTrail - A function that generates the genesis trail.
 * - GenesisTrailInput - The input type for the generateGenesisTrail function.
 * - GenesisTrailOutput - The return type for the generateGenesisTrail function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

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

export async function generateGenesisTrail(input: GenesisTrailInput): Promise<GenesisTrailOutput> {
  return generateGenesisTrailFlow(input);
}

const genesisTrailPrompt = ai.definePrompt({
  name: 'genesisTrailPrompt',
  input: {schema: GenesisTrailInputSchema},
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
    inputSchema: GenesisTrailInputSchema,
    outputSchema: GenesisTrailOutputSchema,
  },
  async input => {
    const {output} = await genesisTrailPrompt(input);
    return output!;
  }
);
