import type { ComponentProps } from 'react';

export default function ChevronRightIcon(props: ComponentProps<'svg'>) {
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
        d="M5.25 10.5L8.75 7l-3.5-3.5"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={0.6}
      />
    </svg>
  );
}
