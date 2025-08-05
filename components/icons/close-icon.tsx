import type { ComponentProps } from 'react';

export default function CloseIcon(props: ComponentProps<'svg'>) {
  return (
    <svg
      className="size-6"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      viewBox="0 0 24 24"
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <path
        d="M6 18L18 6M6 6l12 12"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
