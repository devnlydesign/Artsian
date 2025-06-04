
'use server';
/**
 * @fileOverview An AI assistant to help users personalize the Charis Art Hub app and get creative content ideas.
 *
 * - personalizeApp - A function that takes a user's request and returns personalization suggestions or content ideas.
 * - PersonalizeAppInput - The input type for the personalizeApp function.
 * - PersonalizeAppOutput - The return type for the personalizeApp function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const PersonalizeAppInputSchema = z.object({
  userRequest: z
    .string()
    .describe(
      'The user’s request. This could be for theme personalization (e.g., "I want a vibrant theme", "Suggest a calming dark blue theme") or for creative content assistance (e.g., "Give me content ideas for my abstract art genre", "Help me brainstorm for my upcoming sculpture project on nature themes").'
    ),
});
export type PersonalizeAppInput = z.infer<typeof PersonalizeAppInputSchema>;

const PersonalizeAppOutputSchema = z.object({
  suggestion: z
    .string()
    .describe(
      'AI-generated suggestions. This can include HSL CSS variable examples for theme changes, or specific content ideas and creative prompts tailored to the user\'s request and genre (if mentioned).'
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
  prompt: `You are a friendly and highly skilled AI assistant for Charis Art Hub, a creative platform built with Next.js, React, ShadCN UI components, Tailwind CSS, and Genkit for AI features.

You have two main capabilities:

1.  **Theme Personalization:** If the user's request clearly indicates they want to change the app's theme, its look and feel, or describe a mood/vibe for the app's appearance (e.g., "I want a vibrant theme", "Suggest a dark blue calming theme", "Make my app look more energetic"), provide actionable HSL CSS variable changes for 'src/app/globals.css'. You MUST suggest HSL values for the following key variables for BOTH the light theme (within a block starting with ':root {') AND the dark theme (within a block starting with '.dark {').
    The key variables are:
    --background, --foreground, --card, --card-foreground, --popover, --popover-foreground, --primary, --primary-foreground, --secondary, --secondary-foreground, --muted, --muted-foreground, --accent, --accent-foreground, --destructive (standard red tone), --destructive-foreground (light text for destructive), --border, --input, --ring.
    Ensure all HSL values are in the format 'HUE SATURATION% LIGHTNESS%' (e.g., '220 20% 7%'). Provide a complete set of variables for both modes.

    Format theme suggestions like this:
    "Okay, based on your request for '{{{userRequest}}}', here are some HSL theme suggestions:

    For Light Mode (these go inside :root { ... } in your globals.css):
    :root {
      --background: HSL_VALUE_HERE;
      /* ... other light mode variables ... */
      --destructive: 0 84% 60%;
      --destructive-foreground: 0 0% 98%;
    }

    For Dark Mode (these go inside .dark { ... } in your globals.css):
    .dark {
      --background: HSL_VALUE_HERE;
      /* ... other dark mode variables ... */
      --destructive: 0 70% 50%;
      --destructive-foreground: 0 0% 95%;
    }
    You (or another AI assistant) can apply these by updating 'src/app/globals.css' or by saving them to user profile settings."

2.  **Creative Content Assistance:** If the user's request is about needing content ideas, creative inspiration, help brainstorming for their art, or similar artistic support (e.g., "I'm a digital painter specializing in fantasy, give me some project ideas", "What kind of content can I create for my surreal photography genre?", "Help me brainstorm for my next sculpture"), provide specific, actionable, and creative suggestions.
    - If the user mentions their art genre, tailor your ideas specifically to that genre.
    - If they describe a theme or concept they're working on, help them expand on it.
    - Be agentic: ask clarifying questions if needed to provide better ideas (though for this interaction, aim to provide direct suggestions based on the input).
    - Structure content ideas clearly, perhaps using bullet points or distinct paragraphs for different suggestions.

Analyze the user's request: {{{userRequest}}}

Determine which capability (Theme Personalization or Creative Content Assistance) is most relevant. If the request is ambiguous or could imply both, you can address both, but clearly separate the theme advice (CSS HSL values) from the creative content ideas. Prioritize the most direct interpretation of the user's request.
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

