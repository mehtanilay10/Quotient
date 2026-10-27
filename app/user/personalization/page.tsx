import { Metadata } from "next";
import { getCategoryMeta, getQuestionCategories } from "@/lib/content";
import { PersonalizationClient, type LandingPageOption } from "./PersonalizationClient";

export const metadata: Metadata = {
  title: "Personalization | Quotient",
  description: "Customize your learning experience.",
};

export default function PersonalizationPage() {
  // Question answers are category-first, so every category that hosts them
  // is offered as a landing destination.
  const landingPages: LandingPageOption[] = [
    { value: "/", label: "Home" },
    ...getQuestionCategories().map((category) => ({
      value: `/${category}/question-answers`,
      label: `${getCategoryMeta(category).label} Question Answers`,
    })),
  ];

  return <PersonalizationClient landingPages={landingPages} />;
}
