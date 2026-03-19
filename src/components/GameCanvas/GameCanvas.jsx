import { useEffect, useRef } from "preact/hooks";
import { initGame } from "../../game";
import "./GameCanvas.css";

export function GameCanvas({ motion, matchScore, gameState }) {
  const canvasRef = useRef(null);
  const gameRef = useRef(null);

  useEffect(() => {
    gameRef.current = initGame(canvasRef.current);
    return () => gameRef.current?.destroy();
  }, []);

  useEffect(() => {
    gameRef.current?.setMotion(motion);
  }, [motion]);

  useEffect(() => {
    gameRef.current?.setMatchScore(matchScore);
  }, [matchScore]);

  useEffect(() => {
    gameRef.current?.setGameState(gameState);
  }, [gameState]);

  return (
    <div class="game-wrapper">
      <canvas ref={canvasRef} id="game-canvas" />
    </div>
  );
}
