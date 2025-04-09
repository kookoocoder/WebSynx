import Spinner from "@/components/spinner";
import { ComponentProps } from "react";
import { useFormStatus } from "react-dom";

interface LoadingButtonProps extends ComponentProps<"button"> {
  isLoading?: boolean;
  spinnerClassName?: string;
}

export default function LoadingButton({
  children,
  isLoading,
  spinnerClassName,
  ...rest
}: LoadingButtonProps) {
  const { pending } = useFormStatus();
  const isButtonLoading = isLoading !== undefined ? isLoading : pending;

  return (
    <button {...rest} disabled={isButtonLoading}>
      <Spinner loading={isButtonLoading} className={spinnerClassName}>{children}</Spinner>
    </button>
  );
}
