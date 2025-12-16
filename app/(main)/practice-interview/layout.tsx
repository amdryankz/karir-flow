import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Practice Interview",
};

export default function PracticeInterviewLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
