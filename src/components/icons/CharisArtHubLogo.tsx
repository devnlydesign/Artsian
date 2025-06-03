
import type { SVGProps } from 'react';

export function CharisArtHubLogo(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="currentColor" 
      {...props}
    >
      {/* A simple, abstract gem-like shape */}
      <path d="M12 1.5L3.5 8.5L5.25 19.5L12 22.5L18.75 19.5L20.5 8.5L12 1.5Z" />
    </svg>
  );
}
