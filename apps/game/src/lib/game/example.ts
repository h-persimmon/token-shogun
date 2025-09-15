import { createAttackComponent } from "./components/attack-component";
import { createHealthComponent } from "./components/health-component";
import { createMovementComponent } from "./components/movement-component";
import { createPositionComponent } from "./components/position-component";
import { createStructureComponent } from "./components/structure-component";
import { createTargetComponent } from "./components/target-component";
import { createUnitComponent } from "./components/unit-component";
import {
  createEntityManager,
} from "./entities/entity-manager";


// ゲームシーンでの使用例
export const setupEntityManager = (scene: Phaser.Scene) => {
  const entityManager = createEntityManager(scene);

  // 共通のEntity Groupsを作成
  // createCommonEntityGroups(entityManager);

  // ゲート（門）を作成
  const gate = entityManager.createEntity("gate", 0, 0);
  entityManager.addComponent(gate.id, createPositionComponent(24, 12));
  entityManager.addComponent(gate.id, createHealthComponent(200));
  const gateStructure = createStructureComponent(true, "none", "cannon"); // 重要な構造物、攻撃不可
  (gateStructure as any).structureType = "gate"; // 識別用
  entityManager.addComponent(gate.id, gateStructure);

  gate.sprite = scene.add.sprite(
    gate.components.position?.point.x || 0,
    gate.components.position?.point.y || 0,
    "crystal",
  );
  gate.sprite.setScale(3.0)

  // 砲台攻撃ストラクチャー（Artillery）を作成
  const artilleryCannon1 = entityManager.createEntity("cannon", 200, 150, 0.5);
  entityManager.addComponent(
    artilleryCannon1.id,
    createPositionComponent(20, 17),
  );
  entityManager.addComponent(artilleryCannon1.id, createHealthComponent(150));
  const artilleryCannon1Structure = createStructureComponent(
    false,
    "with-unit",
    "cannon",
  );
  (artilleryCannon1Structure as any).structureType = "artillery_cannon";
  entityManager.addComponent(artilleryCannon1.id, artilleryCannon1Structure);

  // 砲台攻撃用のAttackComponentを作成
  const artilleryAttack1 = createAttackComponent(50, 7 * 48, 3.0); // 高威力、長射程、長クールダウン
  artilleryAttack1.attackType = "artillery";
  artilleryAttack1.projectileSpeed = 200; // 弾丸速度
  artilleryAttack1.explosionRadius = 60; // 爆発範囲
  artilleryAttack1.flightTime = 1.5; // 飛行時間
  artilleryAttack1.projectileSprite = "cannonball";
  entityManager.addComponent(artilleryCannon1.id, artilleryAttack1);
  entityManager.addComponent(artilleryCannon1.id, createTargetComponent());

  const artilleryCannon2 = entityManager.createEntity("cannon", 200, 450, 0.5);
  entityManager.addComponent(
    artilleryCannon2.id,
    createPositionComponent(28, 17),
  );
  entityManager.addComponent(artilleryCannon2.id, createHealthComponent(150));
  const artilleryCannon2Structure = createStructureComponent(
    false,
    "with-unit",
    "cannon",
  );
  (artilleryCannon2Structure as any).structureType = "artillery_cannon";
  entityManager.addComponent(artilleryCannon2.id, artilleryCannon2Structure);

  const artilleryAttack2 = createAttackComponent(50, 7 * 48, 3.0);
  artilleryAttack2.attackType = "artillery";
  artilleryAttack2.projectileSpeed = 200;
  artilleryAttack2.explosionRadius = 60;
  artilleryAttack2.flightTime = 1.5;
  artilleryAttack2.projectileSprite = "cannonball";
  entityManager.addComponent(artilleryCannon2.id, artilleryAttack2);
  entityManager.addComponent(artilleryCannon2.id, createTargetComponent());

  // 弓矢攻撃ストラクチャー（Archer Tower）を作成
  const archerTower1 = entityManager.createEntity("bow", 300, 200, 0.08);
  entityManager.addComponent(archerTower1.id, createPositionComponent(15, 20));
  entityManager.addComponent(archerTower1.id, createHealthComponent(100));
  const archerTower1Structure = createStructureComponent(
    false,
    "with-unit",
    "archer_tower",
  );
  (archerTower1Structure as any).structureType = "archer_tower";
  entityManager.addComponent(archerTower1.id, archerTower1Structure);

  // 弓矢攻撃用のAttackComponentを作成
  const homingAttack1 = createAttackComponent(25, 10 * 48, 1.2); // 中威力、中射程、短クールダウン
  homingAttack1.attackType = "homing";
  homingAttack1.projectileSpeed = 300; // 高速弾丸
  homingAttack1.projectileSprite = "arrow";
  entityManager.addComponent(archerTower1.id, homingAttack1);
  entityManager.addComponent(archerTower1.id, createTargetComponent());

  const archerTower2 = entityManager.createEntity("bow", 0, 0, 0.08);
  entityManager.addComponent(archerTower2.id, createPositionComponent(33, 20));
  entityManager.addComponent(archerTower2.id, createHealthComponent(100));
  const archerTower2Structure = createStructureComponent(
    false,
    "with-unit",
    "archer_tower",
  );
  (archerTower2Structure as any).structureType = "archer_tower";
  entityManager.addComponent(archerTower2.id, archerTower2Structure);

  const homingAttack2 = createAttackComponent(25, 10 * 48, 1.2);
  homingAttack2.attackType = "homing";
  homingAttack2.projectileSpeed = 300;
  homingAttack2.projectileSprite = "arrow";
  entityManager.addComponent(archerTower2.id, homingAttack2);
  entityManager.addComponent(archerTower2.id, createTargetComponent());

  // 配備可能なユニットを作成（砲台用の砲手）
  const cannoneer1 = entityManager.createEntity("soldier", 350, 200, 2);
  entityManager.addComponent(cannoneer1.id, createPositionComponent(22, 13));
  entityManager.addComponent(cannoneer1.id, createHealthComponent(60));

  // 砲手は直接攻撃（砲台に配備されると砲台の攻撃を使用）
  const cannonneerAttack1 = createAttackComponent(15, 48, 1.0, "direct");
  entityManager.addComponent(cannoneer1.id, cannonneerAttack1);

  entityManager.addComponent(
    cannoneer1.id,
    createUnitComponent("soldier", false),
  );
  entityManager.addComponent(cannoneer1.id, createTargetComponent());
  entityManager.addComponent(cannoneer1.id, createMovementComponent(80)); // 移動可能
  cannoneer1.sprite?.setTint(0x4169e1); // 青色（砲手）

  const cannoneer2 = entityManager.createEntity("soldier", 350, 400, 2);
  entityManager.addComponent(cannoneer2.id, createPositionComponent(23, 13));
  entityManager.addComponent(cannoneer2.id, createHealthComponent(60));

  const cannonneerAttack2 = createAttackComponent(15, 48, 1.0);
  cannonneerAttack2.attackType = "direct";
  entityManager.addComponent(cannoneer2.id, cannonneerAttack2);

  entityManager.addComponent(
    cannoneer2.id,
    createUnitComponent("soldier", false),
  );
  entityManager.addComponent(cannoneer2.id, createTargetComponent());
  entityManager.addComponent(cannoneer2.id, createMovementComponent(80));
  cannoneer2.sprite?.setTint(0x4169e1);

  // 配備可能なユニットを作成（弓矢塔用の弓兵）
  const archer1 = entityManager.createEntity("soldier", 450, 200, 2);
  entityManager.addComponent(archer1.id, createPositionComponent(26, 13));
  entityManager.addComponent(archer1.id, createHealthComponent(50));

  // 弓兵は弓矢攻撃（弓矢塔に配備されると塔の攻撃を使用）
  const archerAttack1 = createAttackComponent(20, 80, 1.2);
  archerAttack1.attackType = "homing"; // 追跡攻撃
  archerAttack1.projectileSpeed = 250;
  archerAttack1.projectileSprite = "arrow";
  entityManager.addComponent(archer1.id, archerAttack1);

  entityManager.addComponent(archer1.id, createUnitComponent("archer", false));
  entityManager.addComponent(archer1.id, createTargetComponent());
  entityManager.addComponent(archer1.id, createMovementComponent(120)); // 高速移動
  archer1.sprite?.setTint(0x00ff00); // 緑色（弓兵）

  const archer2 = entityManager.createEntity("soldier", 450, 400, 2);
  entityManager.addComponent(archer2.id, createPositionComponent(27, 13));
  entityManager.addComponent(archer2.id, createHealthComponent(50));

  const archerAttack2 = createAttackComponent(20, 80, 1.2);
  archerAttack2.attackType = "homing";
  archerAttack2.projectileSpeed = 250;
  archerAttack2.projectileSprite = "arrow";
  entityManager.addComponent(archer2.id, archerAttack2);

  entityManager.addComponent(archer2.id, createUnitComponent("archer", false));
  entityManager.addComponent(archer2.id, createTargetComponent());
  entityManager.addComponent(archer2.id, createMovementComponent(120));
  archer2.sprite?.setTint(0x00ff00);

  return entityManager;
};

/**
 * 実装された攻撃タイプ:
 *
 * 1. 砲台攻撃 (Artillery):
 *    - 高威力、長射程、長クールダウン
 *    - 着弾位置を予測して範囲攻撃
 *    - 爆発範囲: 60ピクセル
 *    - 飛行時間: 1.5秒
 *    - 弾丸速度: 200 pixels/second
 *
 * 2. 弓矢攻撃 (Homing):
 *    - 中威力、中射程、短クールダウン
 *    - 対象を追跡して必中攻撃
 *    - 弾丸速度: 300 pixels/second
 *    - 高速で確実に命中
 *
 * 3. 直接攻撃 (Direct):
 *    - ユニット単体の基本攻撃
 *    - 即座にダメージを与える
 *    - 弾丸なし、エフェクトのみ
 *
 * 配備システム:
 * - 砲手（青色）: 砲台に配備可能
 * - 弓兵（緑色）: 弓矢塔に配備可能
 * - 配備されると、ストラクチャーの攻撃タイプを使用
 */
