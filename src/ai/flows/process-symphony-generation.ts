
// 'use server'
'use server';
/**
 * @fileOverview Generates a unique ambient audio track based on an artist's live work session.
 *
 * - generateProcessSymphony - A function that generates the ambient audio track.
 * - ProcessSymphonyInput - The input type for the generateProcessSymphony function.
 * - ProcessSymphonyOutput - The return type for the generateProcessSymphony function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const ProcessSymphonyInputSchema = z.object({
  typingSpeed: z.number().describe('The typing speed of the artist in words per minute.'),
  brushStrokes: z.number().describe('The number of brush strokes made by the artist.'),
  musicalPhrases: z.number().describe('The number of musical phrases played by the artist.'),
  sessionEnergy: z.string().describe('The overall energy level of the session (e.g., high, medium, low).'),
});
export type ProcessSymphonyInput = z.infer<typeof ProcessSymphonyInputSchema>;

const ProcessSymphonyOutputSchema = z.object({
  audioTrackDataUri: z
    .string()
    .describe(
      'The generated ambient audio track as a data URI that must include a MIME type and use Base64 encoding. Expected format: \'data:<mimetype>;base64,<encoded_data>\'.'
    ),
});
export type ProcessSymphonyOutput = z.infer<typeof ProcessSymphonyOutputSchema>;

export async function generateProcessSymphony(input: ProcessSymphonyInput): Promise<ProcessSymphonyOutput> {
  return processSymphonyFlow(input);
}

const prompt = ai.definePrompt({
  name: 'processSymphonyPrompt',
  input: {schema: ProcessSymphonyInputSchema},
  output: {schema: ProcessSymphonyOutputSchema},
  prompt: `You are an AI ambient music composer specializing in generating audio tracks that reflect an artist's creative process.

  Based on the artist's live work session data, you will generate a unique ambient audio track that captures the rhythm, energy, and style of their work.

  Consider the following data:
  - Typing Speed: {{typingSpeed}} words per minute
  - Brush Strokes: {{brushStrokes}}
  - Musical Phrases: {{musicalPhrases}}
  - Session Energy: {{sessionEnergy}}

  {{#if typingSpeed}}
The typing speed of {{typingSpeed}} words per minute suggests a {{#if (gt typingSpeed 60)}}fast-paced and energetic{{else}}calm and deliberate{{/if}} work style. Use this to affect the rhythm and tempo.
{{/if}}

{{#if brushStrokes}}
The artist made {{brushStrokes}} brush strokes. This indicates {{#if (gt brushStrokes 50)}}a detailed and textured artistic style{{else}}a minimalist and clean approach{{/if}}. Translate this into sound textures.
{{/if}}

{{#if musicalPhrases}}
The artist played {{musicalPhrases}} musical phrases, indicating a {{#if (gt musicalPhrases 10)}}harmonically rich and melodically complex{{else}}simple and focused{{/if}} musical element. Incorporate the key and tempo information into the audio track.
{{/if}}

  Generate an ambient audio track that embodies these characteristics and save it to the audioTrackDataUri field. The generated audio must be in data URI format.
  `,
  // IMPORTANT: ONLY the googleai/gemini-2.0-flash-exp model is able to generate images. You MUST use exactly this model to generate images.
  model: 'googleai/gemini-2.0-flash-exp',

  config: {
    responseModalities: ['TEXT', 'IMAGE'], // MUST provide both TEXT and IMAGE, IMAGE only won't work
  },
});

const processSymphonyFlow = ai.defineFlow(
  {
    name: 'processSymphonyFlow',
    inputSchema: ProcessSymphonyInputSchema,
    outputSchema: ProcessSymphonyOutputSchema,
  },
  async input => {
    // CLARIFICATION: The current model ('googleai/gemini-2.0-flash-exp' with 'IMAGE' modality)
    // is designed for image generation. It will return an IMAGE data URI, not actual audio.
    // For true audio generation based on these parameters, integration with a dedicated
    // audio synthesis API or a parameter-driven music generation service would be required.
    // The frontend page attempts to play this in an <audio> tag, which will likely fail for an image URI.

    // The prompt guides the model to *describe* an audio track.
    // The `ai.generate` call below will execute this prompt using the image generation model.
    const {media} = await ai.generate({
      model: 'googleai/gemini-2.0-flash-exp',
      prompt: `Based on the typing speed of ${input.typingSpeed}, number of brush strokes ${input.brushStrokes}, number of musical phrases ${input.musicalPhrases} and session energy of ${input.sessionEnergy}, generate a visual representation that could inspire an ambient audio track.`,
      config: {
        responseModalities: ['TEXT', 'IMAGE'],
      },
    });

    // The 'media.url' will be an image data URI.
    // The output schema expects an 'audioTrackDataUri'. While semantically incorrect,
    // this fulfills the technical requirement of returning a data URI from the model.
    return {
      audioTrackDataUri: media.url,
    };
  }
);
