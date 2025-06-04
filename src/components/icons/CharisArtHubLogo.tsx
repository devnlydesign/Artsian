
import type { SVGProps } from 'react';

// This component is being replaced by CharisMonogramLogo for the monogram.
// If a full wordmark SVG is needed, this file could be repurposed or a new one created.
// For now, returning the new monogram as a fallback if this is still imported somewhere.
import { CharisMonogramLogo } from './CharisMonogramLogo';


export function CharisArtHubLogo(props: SVGProps<SVGSVGElement>) {
  return <CharisMonogramLogo {...props} />;
}
