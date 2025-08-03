import { GameEngine } from "@/game-logic/engine"

export default function Page() {
  const stageId = 1; // TODO: パスパラメータから取得するように変更
  const gameEngine = new GameEngine(stageId);

  return (
    <div>
      <h1>Hello</h1>
    </div>
  )
}
