import { Game } from "@/components/game";

export default function Page() {
  return (
    <div>
      <a href="game/1">ゲーム</a>
      {/* 以下のコンポーネントは、monorepoの別パッケージから持ってきたもの */}
      {/* propsとして、csvFilePathを渡すと、その設定でゲームが開始する = ステージ選択を反映できる */}
      <Game />
    </div>
  );
}
