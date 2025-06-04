
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
      'AI-generated suggestions to help the user personalize the app. This can include advice on theme changes (providing specific HSL CSS variable examples for "src/app/globals.css" for BOTH :root and .dark selectors), layout ideas, or creative prompts.'
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

Your role is to help the user personalize their experience with the Charis Art Hub app by suggesting HSL color values for CSS variables.
Based on the user's request (mood, vibe, or specific color ideas), provide actionable HSL CSS variable changes for 'src/app/globals.css'.
You MUST suggest HSL values for the following key variables for BOTH the light theme (within a block starting with ':root {') AND the dark theme (within a block starting with '.dark {').
The key variables are:
--background
--foreground
--card
--card-foreground
--popover
--popover-foreground
--primary
--primary-foreground
--secondary
--secondary-foreground
--muted
--muted-foreground
--accent
--accent-foreground
--destructive (you can keep this fairly standard, e.g., a red tone)
--destructive-foreground (e.g., a light color for text on destructive)
--border
--input
--ring (often same as primary or a brighter primary)

User's Request: {{{userRequest}}}

Present the CSS variable changes VERY CLEARLY in two separate blocks: one for :root (light mode) and one for .dark (dark mode).
Example Format:
"Okay, based on your request for '{{{userRequest}}}', here are some HSL theme suggestions:

For Light Mode (these go inside :root { ... } in your globals.css):
:root {
  --background: HSL_VALUE_HERE;
  --foreground: HSL_VALUE_HERE;
  --card: HSL_VALUE_HERE;
  --card-foreground: HSL_VALUE_HERE;
  --popover: HSL_VALUE_HERE;
  --popover-foreground: HSL_VALUE_HERE;
  --primary: HSL_VALUE_HERE;
  --primary-foreground: HSL_VALUE_HERE;
  --secondary: HSL_VALUE_HERE;
  --secondary-foreground: HSL_VALUE_HERE;
  --muted: HSL_VALUE_HERE;
  --muted-foreground: HSL_VALUE_HERE;
  --accent: HSL_VALUE_HERE;
  --accent-foreground: HSL_VALUE_HERE;
  --destructive: 0 84% 60%;
  --destructive-foreground: 0 0% 98%;
  --border: HSL_VALUE_HERE;
  --input: HSL_VALUE_HERE;
  --ring: HSL_VALUE_HERE;
}

For Dark Mode (these go inside .dark { ... } in your globals.css):
.dark {
  --background: HSL_VALUE_HERE;
  --foreground: HSL_VALUE_HERE;
  --card: HSL_VALUE_HERE;
  --card-foreground: HSL_VALUE_HERE;
  --popover: HSL_VALUE_HERE;
  --popover-foreground: HSL_VALUE_HERE;
  --primary: HSL_VALUE_HERE;
  --primary-foreground: HSL_VALUE_HERE;
  --secondary: HSL_VALUE_HERE;
  --secondary-foreground: HSL_VALUE_HERE;
  --muted: HSL_VALUE_HERE;
  --muted-foreground: HSL_VALUE_HERE;
  --accent: HSL_VALUE_HERE;
  --accent-foreground: HSL_VALUE_HERE;
  --destructive: 0 70% 50%;
  --destructive-foreground: 0 0% 95%;
  --border: HSL_VALUE_HERE;
  --input: HSL_VALUE_HERE;
  --ring: HSL_VALUE_HERE;
}
You (or another AI assistant) can apply these by updating 'src/app/globals.css' or by saving them to user profile settings."

Ensure all HSL values are in the format 'HUE SATURATION% LIGHTNESS%' (e.g., '220 20% 7%').
Provide a complete set of variables for both modes.
If the user mentions specific colors, try to incorporate them. If they mention a mood (e.g., "calm", "energetic"), choose colors that evoke that mood.
If the user asks for layout ideas or other personalization, provide concise, actionable advice related to THIS app's capabilities, but prioritize theme HSL generation if a theme change is implied.
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
