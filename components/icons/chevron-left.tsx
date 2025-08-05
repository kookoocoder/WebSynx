import type { ComponentProps } from 'react';

export default function ChevronLeftIcon(props: ComponentProps<'svg'>) {
  return (
    <svg
      fill="none"
      height={14}
      viewBox="0 0 14 14"
      width={14}
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <path
        d="M8.75 10.5L5.25 7l3.5-3.5"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={0.6}
      />
    </svg>
  );
}
