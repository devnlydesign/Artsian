
'use server';
/**
 * @fileOverview An AI agent that analyzes an artist's work and mood to suggest Flux Signature updates.
 *
 * - analyzeAndSuggestFluxSignature - A function that generates suggestions for Flux Signature components.
 * - FluxSignatureAnalysisInput - The input type for the flow.
 * - FluxSignatureAnalysisOutput - The return type for the flow.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const FluxSignatureAnalysisInputSchema = z.object({
  userId: z.string().describe("The ID of the user whose signature is being analyzed."),
  artworksSummary: z
    .string()
    .describe(
      "A textual summary of the artist's recent artworks, including titles, types (e.g., 'Digital Painting', 'Sketch'), and brief descriptions."
    ),
  currentMood: z
    .string()
    .describe("The artist's self-described current mood or creative state (e.g., 'Inspired', 'Reflective', 'Energetic')."),
});
export type FluxSignatureAnalysisInput = z.infer<typeof FluxSignatureAnalysisInputSchema>;

const FluxSignatureAnalysisOutputSchema = z.object({
  suggestedKeywords: z
    .array(z.string())
    .describe(
      'A list of 3-5 keywords that capture the essence of the artworks and mood.'
    ),
  suggestedStyleDescription: z
    .string()
    .describe('A concise (1-2 sentences) description of the artist’s current style based on the inputs.'),
  suggestedDominantColors: z
    .array(z.string().regex(/^#(?:[0-9a-fA-F]{3}){1,2}$/, "Colors must be valid hex codes e.g. #RRGGBB or #RGB"))
    .describe(
      'An array of 2-4 hex color codes that thematically represent the artworks and mood. These should be inspired by the descriptions, not pixel analysis.'
    ),
  suggestedVisualTheme: z
    .string()
    .describe(
      'A brief (1-2 sentences) textual description of a visual theme for the Flux Signature. This could inspire an AI image generation model later.'
    ),
});
export type FluxSignatureAnalysisOutput = z.infer<typeof FluxSignatureAnalysisOutputSchema>;

export async function analyzeAndSuggestFluxSignature(input: FluxSignatureAnalysisInput): Promise<FluxSignatureAnalysisOutput> {
  return fluxSignatureAnalysisFlow(input);
}

const prompt = ai.definePrompt({
  name: 'fluxSignatureAnalysisPrompt',
  input: {schema: FluxSignatureAnalysisInputSchema},
  output: {schema: FluxSignatureAnalysisOutputSchema},
  prompt: `You are an insightful art curator and creative analyst. Your task is to analyze an artist's recent work and current mood to suggest updates for their dynamic "Flux Signature".

Artist's Current Mood: {{{currentMood}}}

Summary of Artist's Recent Artworks:
{{{artworksSummary}}}

Based on the provided mood and artwork summary, please generate the following:
1.  **Suggested Keywords**: 3-5 evocative keywords that encapsulate the primary themes, techniques, or feelings evident in the work and mood.
2.  **Suggested Style Description**: A concise 1-2 sentence description of the artist's perceived current style.
3.  **Suggested Dominant Colors**: A palette of 2-4 hex color codes (e.g., #FF5733) that *thematically* represent the mood and artwork descriptions. These colors should be inspired by the textual descriptions (e.g., if the art is described as "serene ocean landscapes", suggest blues and greens; if "fiery abstract", suggest reds and oranges). Do not attempt pixel analysis.
4.  **Suggested Visual Theme**: A brief 1-2 sentence textual description for a visual theme that could represent this Flux Signature. This description might be used later to prompt an AI image generator.

Return your suggestions in the specified JSON format. Ensure hex color codes are valid.
Example for dominant colors: If artworks are "ethereal, dreamy, sky-scapes" and mood is "peaceful", colors like ["#A0D2DB", "#B0E0E6", "#E0FFFF"] would be appropriate.
Example for visual theme: "A softly glowing orb that subtly shifts in color, with gentle, swirling patterns representing creative energy."
`,
});

const fluxSignatureAnalysisFlow = ai.defineFlow(
  {
    name: 'fluxSignatureAnalysisFlow',
    inputSchema: FluxSignatureAnalysisInputSchema,
    outputSchema: FluxSignatureAnalysisOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    if (!output) {
      throw new Error("The AI failed to generate flux signature suggestions.");
    }
    // Basic validation for color hex codes, as LLM might still miss the format
    if (output.suggestedDominantColors) {
        output.suggestedDominantColors = output.suggestedDominantColors.map(color => {
            if (/^#(?:[0-9a-fA-F]{3}){1,2}$/.test(color)) {
                return color.toUpperCase();
            }
            // Attempt to fix if only 6 chars without #
            if (/^(?:[0-9a-fA-F]{6})$/.test(color)) {
                return `#${color.toUpperCase()}`;
            }
            // Fallback or throw error - for now, let's return a default if invalid to avoid breaking UI.
            // In a real scenario, you might want more robust error handling or re-prompting.
            console.warn(`Invalid color format from AI: ${color}. Using default.`);
            return '#CCCCCC'; 
        }).filter(Boolean) as string[]; // Filter out any undefined/null from potential future complex fixes
         if (output.suggestedDominantColors.length === 0) {
             output.suggestedDominantColors = ["#CCCCCC", "#AAAAAA"]; // Ensure at least two defaults if all fail
         }
    }


    return output;
  }
);
