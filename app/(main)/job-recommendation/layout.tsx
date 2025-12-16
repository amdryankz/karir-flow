import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Job Recommendations",
};

export default function JobRecommendationLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
