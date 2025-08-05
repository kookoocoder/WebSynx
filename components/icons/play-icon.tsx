import type { ComponentProps } from 'react';

export default function PlayIcon(props: ComponentProps<'svg'>) {
  return (
    <svg
      fill="none"
      height={24}
      viewBox="0 0 24 24"
      width={24}
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <path
        d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M15.91 11.672a.374.374 0 01.141.518.374.374 0 01-.141.138l-5.603 3.113a.375.375 0 01-.557-.328V8.887c0-.286.307-.466.557-.327l5.603 3.112z"
        fill="currentColor"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.5}
      />
    </svg>
  );
}
