
import type { SVGProps } from 'react';

// This SVG is a representation of the provided logo image.
// It consists of two main arc shapes.
export function CharisMonogramLogo(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 64 64" // Adjusted viewBox for clarity
      fill="currentColor"
      {...props}
    >
      {/* Top arc segment */}
      <path d="M52.5,20.3c-3.4-4.5-8.3-7.3-13.8-7.3c-10.6,0-19.2,8.6-19.2,19.2c0,3.1,0.7,6,2.1,8.6
        c-3.7-1.3-7-3.4-9.8-6.1c-1.3,3.1-2.1,6.5-2.1,10.1c0,13.9,11.3,25.2,25.2,25.2c4.9,0,9.5-1.4,13.3-3.9
        c6.5-4.4,10.8-11.6,10.8-19.6C63,28.9,58.8,23.5,52.5,20.3z M49.6,16.5C45,11,37.8,8,30,8
        C15.6,8,4,19.6,4,34c0,7.2,2.9,13.8,7.6,18.5C10.1,50.8,9,48,9,45c0-10.5,8.5-19,19-19c4.5,0,8.5,1.5,11.7,4.1
        C42.2,26.2,46.1,22.7,49.6,16.5z" />
      {/* Bottom arc segment - simplified and scaled */}
      <path d="M43.2,41.9c-2.7-2.5-6.4-4.1-10.5-4.1c-8.3,0-15,6.7-15,15c0,3.1,1,6,2.6,8.4
        c4.6,4.3,10.9,7,17.9,7c5.9,0,11.2-2,15.3-5.3C45.2,58.3,42.1,50.7,43.2,41.9z M34.5,55.9c-4.9,0-8.8-4-8.8-8.8
        s4-8.8,8.8-8.8s8.8,4,8.8,8.8S39.4,55.9,34.5,55.9z" transform="scale(0.85) translate(7 5)"/>
    </svg>
  );
}
