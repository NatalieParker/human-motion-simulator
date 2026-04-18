import { LearnConceptLevel } from "./LearnConceptLevel";
import { LEARN_CONCEPTS_BY_ID } from "../lib/learnConcepts";

export function LearnFreefallLevelPage() {
  return (
    <LearnConceptLevel
      concept={LEARN_CONCEPTS_BY_ID["freefall-acceleration"]}
      pageTitle="Learn Level 7"
    />
  );
}
