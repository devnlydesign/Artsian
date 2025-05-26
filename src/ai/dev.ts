
import { config } from 'dotenv';
config();

import '@/ai/flows/genesis-trail-generation.ts';
import '@/ai/flows/algorithmic-muse-prompt.ts';
import '@/ai/flows/process-symphony-generation.ts';
import '@/ai/flows/amplify-flux-pulse.ts';
import '@/ai/flows/personalization-assistant-flow.ts';
// Ensure genesisTrailActions.ts is not imported here if it only contains server actions and not Genkit flows.
// import '@/actions/genesisTrailActions.ts'; // This line would be incorrect if it's just server actions
