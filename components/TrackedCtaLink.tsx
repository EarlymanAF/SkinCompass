"use client";

import type { MouseEvent, ReactNode } from "react";
import { trackEvent } from "@/lib/analytics";

type TrackedCtaLinkProps = Omit<React.ComponentPropsWithoutRef<"a">, "children"> & {
  children: ReactNode;
  ctaId: string;
  ctaLabel: string;
  ctaLocation: string;
};

export default function TrackedCtaLink({
  children,
  ctaId,
  ctaLabel,
  ctaLocation,
  href,
  onClick,
  ...props
}: TrackedCtaLinkProps) {
  const handleClick = (event: MouseEvent<HTMLAnchorElement>) => {
    onClick?.(event);
    trackEvent("cta_click", {
      cta_id: ctaId,
      cta_label: ctaLabel,
      cta_location: ctaLocation,
      destination: typeof href === "string" ? href : undefined,
    });
  };

  return (
    <a href={href} onClick={handleClick} {...props}>
      {children}
    </a>
  );
}
