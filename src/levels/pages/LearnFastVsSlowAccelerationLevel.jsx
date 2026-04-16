import { LearnConceptLevel } from "./LearnConceptLevel";
import { LEARN_CONCEPTS_BY_ID } from "../lib/learnConcepts";

export function LearnFastVsSlowAccelerationLevelPage() {
  return (
    <LearnConceptLevel
      concept={LEARN_CONCEPTS_BY_ID["fast-vs-slow-acceleration"]}
      pageTitle="Learn Level 11"
    />
  );
}
