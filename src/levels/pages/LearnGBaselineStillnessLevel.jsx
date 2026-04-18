import { LearnConceptLevel } from "./LearnConceptLevel";
import { LEARN_CONCEPTS_BY_ID } from "../lib/learnConcepts";

export function LearnGBaselineStillnessLevelPage() {
  return (
    <LearnConceptLevel
      concept={LEARN_CONCEPTS_BY_ID["g-baseline-stillness"]}
      pageTitle="Learn Level 8"
    />
  );
}
