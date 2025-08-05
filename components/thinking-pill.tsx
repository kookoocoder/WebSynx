'use client';

import { Brain } from 'lucide-react';
import type React from 'react';
import { useEffect, useState } from 'react';

interface ThinkingPillProps {
  isThinking?: boolean;
}

const ThinkingPill: React.FC<ThinkingPillProps> = ({ isThinking = false }) => {
  const [thinkingTime, setThinkingTime] = useState(0);
  const [startTime, setStartTime] = useState<number | null>(null);
  const [isDone, setIsDone] = useState(false);

  useEffect(() => {
    if (isThinking && !startTime) {
      // Start the timer when thinking begins
      setStartTime(Date.now());
    } else if (!isThinking && startTime && !isDone) {
      // Calculate thinking time when thinking ends
      const endTime = Date.now();
      const seconds = Math.round((endTime - startTime) / 1000);
      setThinkingTime(seconds);
      setIsDone(true);
    }
  }, [isThinking, startTime, isDone]);

  return (
    <div className="my-4">
      <div
        className={`inline-flex w-full ${isDone ? '' : 'animate-pulse'} items-center gap-2 rounded-xl border border-gray-700 bg-gray-800/50 p-3 backdrop-blur-[1px]`}
      >
        <div className="flex size-8 items-center justify-center rounded-lg bg-purple-500/20 text-purple-400">
          <Brain className="h-4 w-4" />
        </div>
        <div className="flex flex-col gap-0.5 text-left leading-none">
          <div className="font-medium text-gray-200 text-sm leading-none">
            {isDone ? `Thought for ${thinkingTime} seconds` : 'Thinking...'}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ThinkingPill;
