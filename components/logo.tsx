"use client";

import Image from "next/image";
import Link from "next/link";

export function Logo({
  href = "/",
  width = 200,
  height = 200,
}: {
  href?: string;
  width?: number;
  height?: number;
}) {
  return (
    <Link
      href={href}
      className="flex items-center gap-3"
      aria-label="Karir Flow home"
    >
      <Image
        src="/logo-dashboard-lightmode.svg"
        alt="Karir Flow logo"
        width={width}
        height={height}
        className="block dark:hidden h-14 w-auto"
        priority
      />
      <Image
        src="/logo-dashboard-darkmode.svg"
        alt="Karir Flow logo"
        width={width}
        height={height}
        className="hidden dark:block h-14 w-auto"
        priority
      />
    </Link>
  );
}
