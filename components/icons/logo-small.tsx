import type { ComponentProps } from 'react';

export default function LogoSmall(props: ComponentProps<'svg'>) {
  return (
    <svg
      fill="none"
      height={20}
      viewBox="0 0 20 20"
      width={20}
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <rect
        fill="url(#paint0_linear_611_2729)"
        height={19.5}
        rx={1.75}
        stroke="url(#paint1_linear_611_2729)"
        strokeWidth={0.5}
        width={19.5}
        x={0.25}
        y={0.25}
      />
      <g
        filter="url(#filter0_f_611_2729)"
        style={{
          mixBlendMode: 'overlay',
        }}
      >
        <path d="M13.584 8.16h4.923" stroke="#D9D9D9" strokeWidth={0.3} />
      </g>
      <g
        filter="url(#filter1_f_611_2729)"
        style={{
          mixBlendMode: 'overlay',
        }}
      >
        <path d="M13.143 13.279h4.922" stroke="#D9D9D9" strokeWidth={0.3} />
      </g>
      <g
        filter="url(#filter2_f_611_2729)"
        style={{
          mixBlendMode: 'overlay',
        }}
      >
        <path d="M14.43 12.32h2.597" stroke="#D9D9D9" strokeWidth={0.3} />
      </g>
      <g
        filter="url(#filter3_f_611_2729)"
        style={{
          mixBlendMode: 'overlay',
        }}
      >
        <path d="M5.582 8.85h2.596" stroke="#D9D9D9" strokeWidth={0.3} />
      </g>
      <g
        filter="url(#filter4_f_611_2729)"
        style={{
          mixBlendMode: 'overlay',
        }}
      >
        <path d="M4.546 10.565h1.756" stroke="#D9D9D9" strokeWidth={0.3} />
      </g>
      <path
        d="M12.916 13.426l2.917-3.01-2.917-3.008m-5.833 0l-2.917 3.009 2.917 3.01M11.166 5L8.833 15.834"
        stroke="#fff"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.3}
      />
      <defs>
        <filter
          colorInterpolationFilters="sRGB"
          filterUnits="userSpaceOnUse"
          height={2.2998}
          id="filter0_f_611_2729"
          width={6.922_85}
          x={12.584}
          y={7.0105}
        >
          <feFlood floodOpacity={0} result="BackgroundImageFix" />
          <feBlend in="SourceGraphic" in2="BackgroundImageFix" result="shape" />
          <feGaussianBlur
            result="effect1_foregroundBlur_611_2729"
            stdDeviation={0.5}
          />
        </filter>
        <filter
          colorInterpolationFilters="sRGB"
          filterUnits="userSpaceOnUse"
          height={2.2998}
          id="filter1_f_611_2729"
          width={6.922_85}
          x={12.1426}
          y={12.1289}
        >
          <feFlood floodOpacity={0} result="BackgroundImageFix" />
          <feBlend in="SourceGraphic" in2="BackgroundImageFix" result="shape" />
          <feGaussianBlur
            result="effect1_foregroundBlur_611_2729"
            stdDeviation={0.5}
          />
        </filter>
        <filter
          colorInterpolationFilters="sRGB"
          filterUnits="userSpaceOnUse"
          height={2.2998}
          id="filter2_f_611_2729"
          width={4.596_19}
          x={13.4307}
          y={11.1694}
        >
          <feFlood floodOpacity={0} result="BackgroundImageFix" />
          <feBlend in="SourceGraphic" in2="BackgroundImageFix" result="shape" />
          <feGaussianBlur
            result="effect1_foregroundBlur_611_2729"
            stdDeviation={0.5}
          />
        </filter>
        <filter
          colorInterpolationFilters="sRGB"
          filterUnits="userSpaceOnUse"
          height={2.2998}
          id="filter3_f_611_2729"
          width={4.596_19}
          x={4.581_54}
          y={7.700_68}
        >
          <feFlood floodOpacity={0} result="BackgroundImageFix" />
          <feBlend in="SourceGraphic" in2="BackgroundImageFix" result="shape" />
          <feGaussianBlur
            result="effect1_foregroundBlur_611_2729"
            stdDeviation={0.5}
          />
        </filter>
        <filter
          colorInterpolationFilters="sRGB"
          filterUnits="userSpaceOnUse"
          height={2.2998}
          id="filter4_f_611_2729"
          width={3.755_86}
          x={3.5459}
          y={9.415_28}
        >
          <feFlood floodOpacity={0} result="BackgroundImageFix" />
          <feBlend in="SourceGraphic" in2="BackgroundImageFix" result="shape" />
          <feGaussianBlur
            result="effect1_foregroundBlur_611_2729"
            stdDeviation={0.5}
          />
        </filter>
        <linearGradient
          gradientUnits="userSpaceOnUse"
          id="paint0_linear_611_2729"
          x1={10}
          x2={10}
          y1={0}
          y2={20}
        >
          <stop stopColor="#326DF5" />
          <stop offset={1} stopColor="#1D264A" />
        </linearGradient>
        <linearGradient
          gradientUnits="userSpaceOnUse"
          id="paint1_linear_611_2729"
          x1={10}
          x2={10}
          y1={20}
          y2={0}
        >
          <stop stopColor="#326DF5" />
          <stop offset={1} stopColor="#1D264A" />
        </linearGradient>
      </defs>
    </svg>
  );
}
