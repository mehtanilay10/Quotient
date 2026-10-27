import Image from "next/image";
import { cn } from "@/lib/utils";

export function Logo({ className }: { className?: string }) {
  return (
    <>
      <Image
        src="/logo-light.svg"
        alt=""
        role="presentation"
        aria-hidden="true"
        width={32}
        height={32}
        className={cn("block dark:hidden", className)}
      />
      <Image
        src="/logo-dark.svg"
        alt=""
        role="presentation"
        aria-hidden="true"
        width={32}
        height={32}
        className={cn("hidden dark:block", className)}
      />
    </>
  );
}
