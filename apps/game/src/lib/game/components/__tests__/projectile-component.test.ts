import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  acquireArtilleryProjectileFromPool,
  acquireHomingProjectileFromPool,
  cleanupProjectileVisuals,
  createArtilleryProjectile,
  createHomingProjectile,
  createProjectilePool,
  hasLanded,
  hasValidTarget,
  isArtilleryProjectile,
  isHomingProjectile,
  isProjectileComponent,
  isValidArtilleryProjectile,
  isValidHomingProjectile,
  isValidProjectile,
  PoolableProjectileComponent,
  releaseProjectileToPool,
  setProjectileSprite,
  setProjectileTrail,
  updateFlightTime,
  updateTarget,
} from "../projectile-component";

describe("ProjectileComponent", () => {
  describe("createArtilleryProjectile", () => {
    it("砲台攻撃用の弾丸コンポーネントを正しく作成する", () => {
      const projectile = createArtilleryProjectile(
        "attacker-1",
        50,
        200,
        { x: 100, y: 150 },
        80,
        2.0,
      );

      expect(projectile.type).toBe("projectile");
      expect(projectile.attackerId).toBe("attacker-1");
      expect(projectile.attackType).toBe("artillery");
      expect(projectile.damage).toBe(50);
      expect(projectile.speed).toBe(200);
      expect(projectile.targetPosition).toEqual({ x: 100, y: 150 });
      expect(projectile.explosionRadius).toBe(80);
      expect(projectile.flightTime).toBe(2.0);
      expect(projectile.targetEntityId).toBeUndefined();
    });
  });

  describe("createHomingProjectile", () => {
    it("弓矢攻撃用の弾丸コンポーネントを正しく作成する", () => {
      const projectile = createHomingProjectile(
        "attacker-2",
        30,
        300,
        "target-1",
      );

      expect(projectile.type).toBe("projectile");
      expect(projectile.attackerId).toBe("attacker-2");
      expect(projectile.attackType).toBe("homing");
      expect(projectile.damage).toBe(30);
      expect(projectile.speed).toBe(300);
      expect(projectile.targetEntityId).toBe("target-1");
      expect(projectile.flightTime).toBe(0);
      expect(projectile.targetPosition).toBeUndefined();
      expect(projectile.explosionRadius).toBeUndefined();
    });
  });

  describe("isProjectileComponent", () => {
    it("ProjectileComponentを正しく判定する", () => {
      const projectile = createArtilleryProjectile(
        "attacker-1",
        50,
        200,
        { x: 100, y: 150 },
        80,
        2.0,
      );
      const notProjectile = { type: "attack", damage: 50 };

      expect(isProjectileComponent(projectile)).toBe(true);
      expect(isProjectileComponent(notProjectile as any)).toBe(false);
    });
  });

  describe("isArtilleryProjectile", () => {
    it("砲台弾丸を正しく判定する", () => {
      const artilleryProjectile = createArtilleryProjectile(
        "attacker-1",
        50,
        200,
        { x: 100, y: 150 },
        80,
        2.0,
      );
      const homingProjectile = createHomingProjectile(
        "attacker-2",
        30,
        300,
        "target-1",
      );

      expect(isArtilleryProjectile(artilleryProjectile)).toBe(true);
      expect(isArtilleryProjectile(homingProjectile)).toBe(false);
    });
  });

  describe("isHomingProjectile", () => {
    it("弓矢弾丸を正しく判定する", () => {
      const artilleryProjectile = createArtilleryProjectile(
        "attacker-1",
        50,
        200,
        { x: 100, y: 150 },
        80,
        2.0,
      );
      const homingProjectile = createHomingProjectile(
        "attacker-2",
        30,
        300,
        "target-1",
      );

      expect(isHomingProjectile(artilleryProjectile)).toBe(false);
      expect(isHomingProjectile(homingProjectile)).toBe(true);
    });
  });

  describe("updateFlightTime", () => {
    it("砲台弾丸の飛行時間を正しく更新する", () => {
      const projectile = createArtilleryProjectile(
        "attacker-1",
        50,
        200,
        { x: 100, y: 150 },
        80,
        2.0,
      );

      updateFlightTime(projectile, 0.5);
      expect(projectile.flightTime).toBe(1.5);

      updateFlightTime(projectile, 1.0);
      expect(projectile.flightTime).toBe(0.5);

      updateFlightTime(projectile, 1.0);
      expect(projectile.flightTime).toBe(0); // 負の値にならない
    });

    it("弓矢弾丸の飛行時間は更新しない", () => {
      const projectile = createHomingProjectile(
        "attacker-2",
        30,
        300,
        "target-1",
      );
      const originalFlightTime = projectile.flightTime;

      updateFlightTime(projectile, 1.0);
      expect(projectile.flightTime).toBe(originalFlightTime);
    });
  });

  describe("hasLanded", () => {
    it("砲台弾丸の着弾を正しく判定する", () => {
      const projectile = createArtilleryProjectile(
        "attacker-1",
        50,
        200,
        { x: 100, y: 150 },
        80,
        2.0,
      );

      expect(hasLanded(projectile)).toBe(false);

      projectile.flightTime = 0;
      expect(hasLanded(projectile)).toBe(true);
    });

    it("弓矢弾丸は着弾判定しない", () => {
      const projectile = createHomingProjectile(
        "attacker-2",
        30,
        300,
        "target-1",
      );

      expect(hasLanded(projectile)).toBe(false);
    });
  });

  describe("updateTarget", () => {
    it("弓矢弾丸の追跡対象を正しく更新する", () => {
      const projectile = createHomingProjectile(
        "attacker-2",
        30,
        300,
        "target-1",
      );

      updateTarget(projectile, "target-2");
      expect(projectile.targetEntityId).toBe("target-2");
    });

    it("砲台弾丸の追跡対象は更新しない", () => {
      const projectile = createArtilleryProjectile(
        "attacker-1",
        50,
        200,
        { x: 100, y: 150 },
        80,
        2.0,
      );
      const originalTarget = projectile.targetEntityId;

      updateTarget(projectile, "target-1");
      expect(projectile.targetEntityId).toBe(originalTarget);
    });
  });

  describe("hasValidTarget", () => {
    it("弓矢弾丸の有効な追跡対象を正しく判定する", () => {
      const projectile = createHomingProjectile(
        "attacker-2",
        30,
        300,
        "target-1",
      );

      expect(hasValidTarget(projectile)).toBe(true);

      projectile.targetEntityId = "";
      expect(hasValidTarget(projectile)).toBe(false);

      projectile.targetEntityId = undefined;
      expect(hasValidTarget(projectile)).toBe(false);
    });

    it("砲台弾丸は追跡対象判定しない", () => {
      const projectile = createArtilleryProjectile(
        "attacker-1",
        50,
        200,
        { x: 100, y: 150 },
        80,
        2.0,
      );

      expect(hasValidTarget(projectile)).toBe(false);
    });
  });

  describe("visual elements", () => {
    let mockSprite: any;
    let mockTrail: any;

    beforeEach(() => {
      mockSprite = { destroy: vi.fn() };
      mockTrail = { destroy: vi.fn() };
    });

    describe("setProjectileSprite", () => {
      it("弾丸のスプライトを正しく設定する", () => {
        const projectile = createArtilleryProjectile(
          "attacker-1",
          50,
          200,
          { x: 100, y: 150 },
          80,
          2.0,
        );

        setProjectileSprite(projectile, mockSprite);
        expect(projectile.sprite).toBe(mockSprite);
      });
    });

    describe("setProjectileTrail", () => {
      it("弾丸の軌跡を正しく設定する", () => {
        const projectile = createArtilleryProjectile(
          "attacker-1",
          50,
          200,
          { x: 100, y: 150 },
          80,
          2.0,
        );

        setProjectileTrail(projectile, mockTrail);
        expect(projectile.trail).toBe(mockTrail);
      });
    });

    describe("cleanupProjectileVisuals", () => {
      it("弾丸の視覚要素を正しくクリーンアップする", () => {
        const projectile = createArtilleryProjectile(
          "attacker-1",
          50,
          200,
          { x: 100, y: 150 },
          80,
          2.0,
        );
        projectile.sprite = mockSprite;
        projectile.trail = mockTrail;

        cleanupProjectileVisuals(projectile);

        expect(mockSprite.destroy).toHaveBeenCalled();
        expect(mockTrail.destroy).toHaveBeenCalled();
        expect(projectile.sprite).toBeUndefined();
        expect(projectile.trail).toBeUndefined();
      });

      it("視覚要素がない場合でもエラーにならない", () => {
        const projectile = createArtilleryProjectile(
          "attacker-1",
          50,
          200,
          { x: 100, y: 150 },
          80,
          2.0,
        );

        expect(() => cleanupProjectileVisuals(projectile)).not.toThrow();
      });
    });
  });

  describe("validation functions", () => {
    describe("isValidArtilleryProjectile", () => {
      it("有効な砲台弾丸を正しく判定する", () => {
        const validProjectile = createArtilleryProjectile(
          "attacker-1",
          50,
          200,
          { x: 100, y: 150 },
          80,
          2.0,
        );
        expect(isValidArtilleryProjectile(validProjectile)).toBe(true);
      });

      it("無効な砲台弾丸を正しく判定する", () => {
        const invalidProjectile = createArtilleryProjectile(
          "attacker-1",
          50,
          200,
          { x: 100, y: 150 },
          0,
          2.0,
        );
        expect(isValidArtilleryProjectile(invalidProjectile)).toBe(false);

        const homingProjectile = createHomingProjectile(
          "attacker-2",
          30,
          300,
          "target-1",
        );
        expect(isValidArtilleryProjectile(homingProjectile)).toBe(false);
      });
    });

    describe("isValidHomingProjectile", () => {
      it("有効な弓矢弾丸を正しく判定する", () => {
        const validProjectile = createHomingProjectile(
          "attacker-2",
          30,
          300,
          "target-1",
        );
        expect(isValidHomingProjectile(validProjectile)).toBe(true);
      });

      it("無効な弓矢弾丸を正しく判定する", () => {
        const invalidProjectile = createHomingProjectile(
          "attacker-2",
          30,
          0,
          "target-1",
        );
        expect(isValidHomingProjectile(invalidProjectile)).toBe(false);

        const emptyTargetProjectile = createHomingProjectile(
          "attacker-2",
          30,
          300,
          "",
        );
        expect(isValidHomingProjectile(emptyTargetProjectile)).toBe(false);

        const artilleryProjectile = createArtilleryProjectile(
          "attacker-1",
          50,
          200,
          { x: 100, y: 150 },
          80,
          2.0,
        );
        expect(isValidHomingProjectile(artilleryProjectile)).toBe(false);
      });
    });

    describe("isValidProjectile", () => {
      it("有効な弾丸を正しく判定する", () => {
        const validArtillery = createArtilleryProjectile(
          "attacker-1",
          50,
          200,
          { x: 100, y: 150 },
          80,
          2.0,
        );
        const validHoming = createHomingProjectile(
          "attacker-2",
          30,
          300,
          "target-1",
        );

        expect(isValidProjectile(validArtillery)).toBe(true);
        expect(isValidProjectile(validHoming)).toBe(true);
      });

      it("無効な弾丸を正しく判定する", () => {
        const invalidAttackerId = createArtilleryProjectile(
          "",
          50,
          200,
          { x: 100, y: 150 },
          80,
          2.0,
        );
        const invalidDamage = createArtilleryProjectile(
          "attacker-1",
          0,
          200,
          { x: 100, y: 150 },
          80,
          2.0,
        );
        const invalidSpeed = createArtilleryProjectile(
          "attacker-1",
          50,
          0,
          { x: 100, y: 150 },
          80,
          2.0,
        );

        expect(isValidProjectile(invalidAttackerId)).toBe(false);
        expect(isValidProjectile(invalidDamage)).toBe(false);
        expect(isValidProjectile(invalidSpeed)).toBe(false);
      });
    });
  });

  describe("ObjectPool機能", () => {
    describe("PoolableProjectileComponent", () => {
      let poolable: PoolableProjectileComponent;

      beforeEach(() => {
        poolable = new PoolableProjectileComponent();
      });

      it("初期状態で正しく初期化される", () => {
        expect(poolable.isInUse()).toBe(false);
        expect(poolable.component.attackerId).toBe("");
        expect(poolable.component.attackType).toBe("direct");
        expect(poolable.component.damage).toBe(0);
        expect(poolable.component.speed).toBe(0);
        expect(poolable.component.flightTime).toBe(0);
      });

      it("砲台攻撃用に正しく設定される", () => {
        poolable.setupAsArtillery(
          "attacker-1",
          50,
          200,
          { x: 100, y: 150 },
          80,
          2.0,
        );

        expect(poolable.component.attackerId).toBe("attacker-1");
        expect(poolable.component.attackType).toBe("artillery");
        expect(poolable.component.damage).toBe(50);
        expect(poolable.component.speed).toBe(200);
        expect(poolable.component.targetPosition).toEqual({ x: 100, y: 150 });
        expect(poolable.component.explosionRadius).toBe(80);
        expect(poolable.component.flightTime).toBe(2.0);
        expect(poolable.component.targetEntityId).toBeUndefined();
      });

      it("弓矢攻撃用に正しく設定される", () => {
        poolable.setupAsHoming("attacker-2", 30, 300, "target-1");

        expect(poolable.component.attackerId).toBe("attacker-2");
        expect(poolable.component.attackType).toBe("homing");
        expect(poolable.component.damage).toBe(30);
        expect(poolable.component.speed).toBe(300);
        expect(poolable.component.targetEntityId).toBe("target-1");
        expect(poolable.component.flightTime).toBe(0);
        expect(poolable.component.targetPosition).toBeUndefined();
        expect(poolable.component.explosionRadius).toBeUndefined();
      });

      it("reset()で正しくリセットされる", () => {
        // 砲台攻撃用に設定
        poolable.setupAsArtillery(
          "attacker-1",
          50,
          200,
          { x: 100, y: 150 },
          80,
          2.0,
        );
        poolable.setInUse(true);

        // モックスプライトとトレイルを設定
        const mockSprite = {
          setVisible: vi.fn(),
          setPosition: vi.fn(),
          setRotation: vi.fn(),
          setScale: vi.fn(),
          setAlpha: vi.fn(),
        };
        const mockTrail = {
          clear: vi.fn(),
          setVisible: vi.fn(),
        };
        poolable.component.sprite = mockSprite as any;
        poolable.component.trail = mockTrail as any;

        // リセット実行
        poolable.reset();

        // 値がリセットされることを確認
        expect(poolable.isInUse()).toBe(false);
        expect(poolable.component.attackerId).toBe("");
        expect(poolable.component.attackType).toBe("direct");
        expect(poolable.component.damage).toBe(0);
        expect(poolable.component.speed).toBe(0);
        expect(poolable.component.flightTime).toBe(0);
        expect(poolable.component.targetPosition).toBeUndefined();
        expect(poolable.component.explosionRadius).toBeUndefined();
        expect(poolable.component.targetEntityId).toBeUndefined();
        expect(poolable.component.sprite).toBeUndefined();
        expect(poolable.component.trail).toBeUndefined();

        // 視覚要素のリセットが呼ばれることを確認
        expect(mockSprite.setVisible).toHaveBeenCalledWith(false);
        expect(mockSprite.setPosition).toHaveBeenCalledWith(0, 0);
        expect(mockSprite.setRotation).toHaveBeenCalledWith(0);
        expect(mockSprite.setScale).toHaveBeenCalledWith(1, 1);
        expect(mockSprite.setAlpha).toHaveBeenCalledWith(1);
        expect(mockTrail.clear).toHaveBeenCalled();
        expect(mockTrail.setVisible).toHaveBeenCalledWith(false);
      });

      it("使用状態を正しく管理する", () => {
        expect(poolable.isInUse()).toBe(false);

        poolable.setInUse(true);
        expect(poolable.isInUse()).toBe(true);

        poolable.setInUse(false);
        expect(poolable.isInUse()).toBe(false);
      });
    });

    describe("createProjectilePool", () => {
      it("プールが正しく作成される", () => {
        const pool = createProjectilePool(50);
        const stats = pool.getStats();

        expect(stats.maxSize).toBe(50);
        expect(stats.poolSize).toBe(0);
        expect(stats.inUseCount).toBe(0);
        expect(stats.availableCount).toBe(0);
      });

      it("デフォルトサイズでプールが作成される", () => {
        const pool = createProjectilePool();
        const stats = pool.getStats();

        expect(stats.maxSize).toBe(100);
      });
    });

    describe("プールからの取得と返却", () => {
      let pool: ReturnType<typeof createProjectilePool>;

      beforeEach(() => {
        pool = createProjectilePool(10);
      });

      it("砲台攻撃用弾丸をプールから取得できる", () => {
        const poolable = acquireArtilleryProjectileFromPool(
          pool,
          "attacker-1",
          50,
          200,
          { x: 100, y: 150 },
          80,
          2.0,
        );

        expect(poolable.isInUse()).toBe(true);
        expect(poolable.component.attackType).toBe("artillery");
        expect(poolable.component.attackerId).toBe("attacker-1");
        expect(poolable.component.damage).toBe(50);

        const stats = pool.getStats();
        expect(stats.inUseCount).toBe(1);
        expect(stats.availableCount).toBe(0);
      });

      it("弓矢攻撃用弾丸をプールから取得できる", () => {
        const poolable = acquireHomingProjectileFromPool(
          pool,
          "attacker-2",
          30,
          300,
          "target-1",
        );

        expect(poolable.isInUse()).toBe(true);
        expect(poolable.component.attackType).toBe("homing");
        expect(poolable.component.attackerId).toBe("attacker-2");
        expect(poolable.component.damage).toBe(30);
        expect(poolable.component.targetEntityId).toBe("target-1");

        const stats = pool.getStats();
        expect(stats.inUseCount).toBe(1);
        expect(stats.availableCount).toBe(0);
      });

      it("弾丸をプールに返却できる", () => {
        const poolable = acquireArtilleryProjectileFromPool(
          pool,
          "attacker-1",
          50,
          200,
          { x: 100, y: 150 },
          80,
          2.0,
        );

        expect(pool.getStats().inUseCount).toBe(1);

        releaseProjectileToPool(pool, poolable);

        expect(poolable.isInUse()).toBe(false);
        const stats = pool.getStats();
        expect(stats.inUseCount).toBe(0);
        expect(stats.availableCount).toBe(1);
      });

      it("プールの再利用が正しく動作する", () => {
        // 最初の弾丸を取得
        const poolable1 = acquireArtilleryProjectileFromPool(
          pool,
          "attacker-1",
          50,
          200,
          { x: 100, y: 150 },
          80,
          2.0,
        );

        // 返却
        releaseProjectileToPool(pool, poolable1);

        // 2番目の弾丸を取得（再利用される）
        const poolable2 = acquireHomingProjectileFromPool(
          pool,
          "attacker-2",
          30,
          300,
          "target-1",
        );

        // 同じオブジェクトが再利用されることを確認
        expect(poolable1).toBe(poolable2);
        expect(poolable2.component.attackType).toBe("homing"); // 新しい設定が適用されている
        expect(poolable2.component.attackerId).toBe("attacker-2");

        const stats = pool.getStats();
        expect(stats.totalReused).toBe(1);
        expect(stats.reuseRatio).toBeGreaterThan(0);
      });

      it("プールサイズ制限が正しく動作する", () => {
        const smallPool = createProjectilePool(2);

        // プールサイズを超えて取得
        const _poolable1 = acquireArtilleryProjectileFromPool(
          smallPool,
          "attacker-1",
          50,
          200,
          { x: 100, y: 150 },
          80,
          2.0,
        );
        const _poolable2 = acquireHomingProjectileFromPool(
          smallPool,
          "attacker-2",
          30,
          300,
          "target-1",
        );
        const _poolable3 = acquireArtilleryProjectileFromPool(
          smallPool,
          "attacker-3",
          40,
          250,
          { x: 200, y: 250 },
          60,
          1.5,
        );

        const stats = smallPool.getStats();
        expect(stats.poolSize).toBe(2); // プールサイズは制限される
        expect(stats.inUseCount).toBe(2); // 最大2つまで使用中
      });
    });
  });
});
