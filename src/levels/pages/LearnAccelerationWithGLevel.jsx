import { LearnConceptLevel } from "./LearnConceptLevel";
import { LEARN_CONCEPTS_BY_ID } from "../lib/learnConcepts";

export function LearnAccelerationWithGLevelPage() {
  return (
    <LearnConceptLevel
      concept={LEARN_CONCEPTS_BY_ID["acceleration-with-g"]}
      pageTitle="Learn Level 6"
    />
  );
}
