import { LearnConceptLevel } from "./LearnConceptLevel";
import { LEARN_CONCEPTS_BY_ID } from "../lib/learnConcepts";

export function LearnAccelerationVsMotionLevelPage() {
  return (
    <LearnConceptLevel
      concept={LEARN_CONCEPTS_BY_ID["acceleration-vs-motion"]}
      pageTitle="Learn Level 2"
    />
  );
}
