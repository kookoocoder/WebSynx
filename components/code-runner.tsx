'use client';

// import {
//   runJavaScriptCode,
//   runPythonCode,
// } from "@/components/code-runner-actions";
// import CodeRunnerServerAction from "@/components/code-runner-server-action";
import CodeRunnerReact from './code-runner-react';

export default function CodeRunner({
  language,
  code,
  onRequestFix,
}: {
  language: string;
  code: string;
  onRequestFix?: (e: string) => void;
}) {
  return (
    <div className="h-full w-full overflow-hidden rounded-xl">
      <CodeRunnerReact code={code} onRequestFix={onRequestFix} />
    </div>
  );

  // return (
  //   <>
  //     {language === "python" ? (
  //       <CodeRunnerServerAction
  //         code={code}
  //         runCodeAction={runPythonCode}
  //         key={code}
  //       />
  //     ) : ["ts", "js", "javascript", "typescript"].includes(language) ? (
  //       <CodeRunnerServerAction
  //         code={code}
  //         runCodeAction={runJavaScriptCode}
  //         key={code}
  //       />
  //     ) : (
  //       <CodeRunnerReact code={code} />
  //     )}
  //   </>
  // );
}
