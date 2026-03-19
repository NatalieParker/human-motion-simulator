import { StillnessChallenge } from "../StillnessChallenge/StillnessChallenge";
import { RhythmChallenge } from "../RhythmChallenge/RhythmChallenge";
import { AccuracyChallenge } from "../AccuracyChallenge/AccuracyChallenge";
import "./ChallengeOverlay.css";

const CHALLENGES = {
  stillness: StillnessChallenge,
  rhythm: RhythmChallenge,
  accuracy: AccuracyChallenge,
};

export function ChallengeOverlay({
  type,
  sensorData,
  referencePattern,
  motion,
  onComplete,
  onSkip,
  onStart,
  onStop,
}) {
  const Challenge = CHALLENGES[type];
  if (!Challenge) return null;

  return (
    <div class="challenge-overlay">
      <Challenge
        sensorData={sensorData}
        referencePattern={referencePattern}
        motion={motion}
        onComplete={onComplete}
        onStart={onStart}
        onStop={onStop}
      />
      <button class="challenge-overlay__skip" onClick={onSkip}>
        Skip Challenge
      </button>
    </div>
  );
}
