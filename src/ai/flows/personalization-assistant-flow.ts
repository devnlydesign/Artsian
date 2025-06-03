
'use server';
/**
 * @fileOverview An AI assistant to help users personalize the Charis Art Hub app.
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
      'The user’s request for personalization, e.g., theme changes, layout ideas, feature suggestions, or creative inspiration. If asking for theme changes, the user might describe their current mood or desired feeling (e.g., "I feel energetic and want a vibrant theme", or "I want a calming, dark blue theme").'
    ),
});
export type PersonalizeAppInput = z.infer<typeof PersonalizeAppInputSchema>;

const PersonalizeAppOutputSchema = z.object({
  suggestion: z
    .string()
    .describe(
      'AI-generated suggestions to help the user personalize the app. This can include advice on theme changes (providing specific HSL CSS variable examples for "src/app/globals.css"), layout ideas, or creative prompts.'
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
  prompt: `You are a friendly and highly skilled AI assistant integrated within the Charis Art Hub application. Charis Art Hub is a creative platform built with Next.js, React, ShadCN UI components, Tailwind CSS, and Genkit for AI features. The app can adapt to system theme (light/dark) and users can set a preference.

Your role is to help the user personalize their experience with the Charis Art Hub app.
Based on the user's request, provide actionable suggestions.

If the user describes a mood or feeling and asks for a theme change, translate that into a color palette and suggest specific HSL CSS variable changes for 'src/app/globals.css'.
You should suggest changes for BOTH the light theme (variables directly under ':root {}') AND the dark theme (variables within the '.dark {}' selector).
The key variables are:
--background: HSL value (e.g., 220 20% 7%)
--foreground: HSL value (e.g., 220 15% 88%)
--card: HSL value (e.g., 220 20% 10%)
--primary: HSL value (e.g., 200 100% 50%) - This is often used for vibrant gradients.
--accent: HSL value (e.g., 280 80% 60%) - This is also used for vibrant gradients.
--secondary: HSL value (e.g., 220 15% 20%)
--muted: HSL value (e.g., 220 15% 15%)
--border: HSL value (e.g., 220 15% 18%)
--input: HSL value (e.g., 220 15% 16%)
--ring: HSL value (e.g., 200 100% 55%)

User's Request: {{{userRequest}}}

Provide your suggestions in a clear, concise, and helpful manner. Present CSS variable changes clearly for both :root and .dark selectors.
For example, if the user says "I'm feeling creative and energetic and want a theme that reflects that, with purples and bright blues":
"To achieve an energetic theme with purples and bright blues, you could try these HSL values in your 'src/app/globals.css':

For Light Mode (within :root { ... }):
:root {
  --background: 250 60% 97%; /* Very Light Lavender */
  --foreground: 260 40% 20%; /* Deep Indigo Text */
  --primary: 220 90% 55%;   /* Vibrant Blue */
  --accent: 280 90% 60%;    /* Electric Purple */
  /* ... other light mode variables ... */
}

For Dark Mode (within .dark { ... }):
.dark {
  --background: 260 30% 8%; /* Deep Indigo Background */
  --foreground: 250 50% 90%; /* Light Lavender Text */
  --card: 260 30% 12%;
  --primary: 220 90% 60%;   /* Vibrant Blue */
  --accent: 280 90% 65%;    /* Electric Purple */
  /* ... other dark mode variables ... */
}
Remember to review all HSL variables for consistency. You (or another AI assistant) can make these changes by editing the 'src/app/globals.css' file."

If the user asks for "ideas for a futuristic art style", you could suggest:
"For a futuristic art style, you could explore themes like:
- Cybernetic enhancements fused with organic forms.
- Sleek, minimalist cityscapes with neon accents.
- Abstract representations of data flows and digital consciousness.
Consider using metallic textures, glowing lines, and a cool color palette (like blues and purples) with vibrant highlights (like electric pink or lime green)."

Be specific and actionable. The user is looking for concrete advice.
Focus on providing guidance for customizing THIS specific Charis Art Hub app.
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
        return { suggestion: "I received your request, but I'm having a little trouble formulating a specific suggestion right now. Could you try rephrasing or asking something slightly different?" };
    }
    return output;
  }
);
