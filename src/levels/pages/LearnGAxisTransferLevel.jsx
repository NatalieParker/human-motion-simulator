import { LearnConceptLevel } from "./LearnConceptLevel";
import { LEARN_CONCEPTS_BY_ID } from "../lib/learnConcepts";

export function LearnGAxisTransferLevelPage() {
  return (
    <LearnConceptLevel
      concept={LEARN_CONCEPTS_BY_ID["g-axis-transfer"]}
      pageTitle="Learn Level 9"
    />
  );
}
