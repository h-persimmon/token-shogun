// ユニット情報ポップアップシステム用の型定義

export interface UnitInfoData {
  entityId: string;
  unitType: "ally" | "enemy" | "structure";
  name?: string;
  health: {
    current: number;
    max: number;
  };
  attack?: {
    damage: number;
    range: number;
    attackType: string;
  };
  enemyType?: string; // 敵の場合の種別
  structureType?: string; // 構造物の場合の種別
  unitClass?: string; // 味方ユニットの場合のクラス
}

export interface UnitInfoPopup {
  container: Phaser.GameObjects.Container;
  background: Phaser.GameObjects.Rectangle;
  titleText: Phaser.GameObjects.Text;
  infoTexts: Phaser.GameObjects.Text[];
  entityId: string;
}

export interface RangeVisualizerOptions {
  color?: number;
  alpha?: number;
  lineWidth?: number;
  fillAlpha?: number;
}
