
import type { SVGProps } from 'react';

export function CharisMonogramLogo(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 64 64" 
      fill="currentColor"
      {...props}
    >
      {/* Top arc - refined to better match the thicker, more enveloping top crescent */}
      <path d="M54.2,33.3c-0.8-6.7-5.2-12.3-11.2-14.8c-2.6-1.1-5.4-1.7-8.3-1.7c-9.9,0-18.1,6.4-21.2,15.3
        c-0.3,0.8-0.2,1.7,0.3,2.4c0.5,0.7,1.3,1.1,2.2,1.1c1.5,0,2.8-0.9,3.4-2.3c0.1-0.2,0.1-0.3,0.1-0.5
        c2.2-7.1,8.2-12.1,15.2-12.1c2,0,4,0.4,5.8,1.1c4.7,1.9,8.4,6.2,9.5,11.3c0.4,1.8,2.1,3.1,3.9,3.1
        c0.5,0,1-0.1,1.5-0.3C53.4,36.7,54.7,35.1,54.2,33.3z" />
      {/* Bottom arc - refined for position and curvature */}
      <path d="M41.6,40.8c-2.9-2.4-6.5-3.8-10.3-3.8c-7,0-13.1,4-15.9,9.8c-0.5,1.1-0.1,2.4,0.9,2.9
        c0.4,0.2,0.8,0.3,1.2,0.3c0.8,0,1.6-0.4,2-1.2c2.2-4.5,6.6-7.6,11.8-7.6c2.9,0,5.7,0.9,8.1,2.5
        c1.4,0.9,3.2,0.7,4.2-0.7C44.8,42.9,44.3,41.2,41.6,40.8z" />
    </svg>
  );
}
