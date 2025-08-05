import type { ComponentProps } from 'react';

export default function ArrowLeftIcon(props: ComponentProps<'svg'>) {
  return (
    <svg
      fill="none"
      height={12}
      viewBox="0 0 12 12"
      width={12}
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <path
        d="M.75.75v10.5M6.583 2.5L3.083 6m0 0l3.5 3.5M3.083 6h8.167"
        stroke="#525252"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
