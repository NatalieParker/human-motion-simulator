import { LearnConceptLevel } from "./LearnConceptLevel";
import { LEARN_CONCEPTS_BY_ID } from "../lib/learnConcepts";

export function LearnAccelerationVsDecelerationLevelPage() {
  return (
    <LearnConceptLevel
      concept={LEARN_CONCEPTS_BY_ID["acceleration-vs-deceleration"]}
      pageTitle="Learn Level 5"
    />
  );
}
