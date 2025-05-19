
'use server';
/**
 * @fileOverview An AI assistant to help users personalize the ARTISAN app.
 *
 * - personalizeApp - A function that takes a user's request and returns personalization suggestions.
 * - PersonalizeAppInput - The input type for the personalizeApp function.
 * - PersonalizeAppOutput - The return type for the personalizeApp function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const PersonalizeAppInputSchema = z.object({
  userRequest: z
    .string()
    .describe(
      'The user’s request for personalization, e.g., theme changes, layout ideas, feature suggestions, or creative inspiration.'
    ),
});
export type PersonalizeAppInput = z.infer<typeof PersonalizeAppInputSchema>;

const PersonalizeAppOutputSchema = z.object({
  suggestion: z
    .string()
    .describe(
      'AI-generated suggestions to help the user personalize the app. This can include advice on theme changes, layout ideas, or creative prompts.'
    ),
});
export type PersonalizeAppOutput = z.infer<typeof PersonalizeAppOutputSchema>;

export async function personalizeApp(input: PersonalizeAppInput): Promise<PersonalizeAppOutput> {
  return personalizationAssistantFlow(input);
}

const personalizationPrompt = ai.definePrompt({
  name: 'personalizationAssistantPrompt',
  input: {schema: PersonalizeAppInputSchema},
  output: {schema: PersonalizeAppOutputSchema},
  prompt: `You are a friendly and highly skilled AI assistant integrated within the ARTISAN application. ARTISAN is a creative platform built with Next.js, React, ShadCN UI components, Tailwind CSS, and Genkit for AI features.

Your role is to help the user personalize their experience with the ARTISAN app.
Based on the user's request, provide actionable suggestions. These suggestions might involve:
- Modifying theme colors (CSS HSL variables in 'src/app/globals.css').
- Suggesting UI layout ideas (conceptually).
- Proposing new features they might like, keeping in mind the existing tech stack.
- Offering creative prompts or ideas if they ask for artistic inspiration.

User's Request: {{{userRequest}}}

Provide your suggestions in a clear, concise, and helpful manner. If suggesting code changes (like CSS variables), present them clearly and accurately according to the app's structure.
For example, if the user asks for a "darker theme with green accents", you could suggest:
"To achieve a darker theme with green accents, you can update your 'src/app/globals.css' file.
For the dark theme (within the '.dark {}' selector), consider these HSL values:
:root { /* Or .dark specific if a dark class system is fully in place */
  --background: 200 10% 10%; /* Dark Slate Blue-Greenish */
  --foreground: 120 30% 90%; /* Light Greenish White */
  --card: 200 10% 15%;
  --primary: 130 60% 50%;   /* A nice green for primary actions */
  --accent: 140 70% 45%;    /* A complementary green for accents */
  /* ... other variables ... */
}
And for the light theme, you could adjust the --accent to a green shade:
:root {
  --accent: 130 70% 43%; /* Rich Green */
  /* ... other variables ... */
}
Remember to review all HSL variables for consistency. You can find them in 'src/app/globals.css'."

If the user asks for "ideas for a futuristic art style", you could suggest:
"For a futuristic art style, you could explore themes like:
- Cybernetic enhancements fused with organic forms.
- Sleek, minimalist cityscapes with neon accents.
- Abstract representations of data flows and digital consciousness.
Consider using metallic textures, glowing lines, and a cool color palette (like blues and purples) with vibrant highlights (like electric pink or lime green)."

Be specific and actionable. The user is looking for concrete advice they (or another AI assistant helping them with code) can follow.
Focus on providing guidance for customizing THIS specific ARTISAN app.
`,
});

const personalizationAssistantFlow = ai.defineFlow(
  {
    name: 'personalizationAssistantFlow',
    inputSchema: PersonalizeAppInputSchema,
    outputSchema: PersonalizeAppOutputSchema,
  },
  async input => {
    const {output} = await personalizationPrompt(input);
    if (!output) {
        // Fallback or error handling if the prompt doesn't return the expected structure
        // This is crucial as output can sometimes be null if the model doesn't adhere to the schema
        // For now, providing a generic message.
        return { suggestion: "I received your request, but I'm having a little trouble formulating a specific suggestion right now. Could you try rephrasing or asking something slightly different?" };
    }
    return output;
  }
);
