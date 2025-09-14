// Poolable object interface
export interface Poolable {
  reset(): void;
  isInUse(): boolean;
  setInUse(inUse: boolean): void;
}

// Object pool for managing reusable objects
export const createObjectPool = <T extends Poolable>(
  createFn: () => T,
  maxSize: number = 100,
  resetFn?: (obj: T) => void,
) => {
  let pool: T[] = [];
  let currentSize = 0;
  let totalCreated = 0;
  let totalReused = 0;

  const acquire = (): T => {
    let obj: T;
    const availableIndex = pool.findIndex((item) => !item.isInUse());
    if (availableIndex !== -1) {
      obj = pool[availableIndex];
      totalReused++;
    } else if (currentSize < maxSize) {
      obj = createFn();
      pool.push(obj);
      currentSize++;
      totalCreated++;
    } else {
      obj = pool[0];
      if (obj.isInUse()) {
        console.warn(
          "ObjectPool: Forcing reuse of in-use object due to pool size limit",
        );
      }
    }
    obj.reset();
    if (resetFn) resetFn(obj);
    obj.setInUse(true);
    return obj;
  };

  const release = (obj: T): void => {
    if (!obj.isInUse()) {
      console.warn(
        "ObjectPool: Attempting to release object that is not in use",
      );
      return;
    }
    obj.reset();
    obj.setInUse(false);
  };

  const getStats = () => {
    const inUseCount = pool.filter((obj) => obj.isInUse()).length;
    const availableCount = pool.length - inUseCount;
    const totalAcquisitions = totalCreated + totalReused;
    const reuseRatio =
      totalAcquisitions > 0 ? totalReused / totalAcquisitions : 0;
    return {
      poolSize: pool.length,
      maxSize,
      inUseCount,
      availableCount,
      totalCreated,
      totalReused,
      reuseRatio,
    };
  };

  const clear = () => {
    pool.forEach((obj) => {
      obj.reset();
      obj.setInUse(false);
    });
    pool = [];
    currentSize = 0;
  };

  const resize = (newMaxSize: number) => {
    maxSize = newMaxSize;
    if (pool.length > newMaxSize) {
      const excessObjects = pool.splice(newMaxSize);
      excessObjects.forEach((obj) => {
        obj.reset();
        obj.setInUse(false);
      });
      currentSize = newMaxSize;
    }
  };

  return {
    acquire,
    release,
    getStats,
    clear,
    resize,
    getAllObjects: () => [...pool],
    getInUseObjects: () => pool.filter((obj) => obj.isInUse()),
    getAvailableObjects: () => pool.filter((obj) => !obj.isInUse()),
  };
};

// Poolable sprite wrapper for Phaser
export interface PoolableSprite extends Poolable {
  sprite: Phaser.GameObjects.Sprite;
}

export const createPoolableSprite = (
  sprite: Phaser.GameObjects.Sprite,
): PoolableSprite => {
  let inUse = false;
  return {
    sprite,
    reset() {
      sprite.visible = false;
      sprite.setPosition(0, 0);
      sprite.rotation = 0;
      sprite.setScale(1, 1);
      sprite.alpha = 1;
      if ("setTint" in sprite) {
        (sprite as any).setTint(0xffffff);
      }
      inUse = false;
    },
    isInUse() {
      return inUse;
    },
    setInUse(value: boolean) {
      inUse = value;
      sprite.visible = value;
    },
  };
};

// Sprite pool for managing Phaser sprites
// 必ずsceneを渡してSpriteを生成する
export const createSpritePool = (
  scene: Phaser.Scene,
  textureKey: string,
  maxSize: number = 100,
) => {
  const createFn = () =>
    createPoolableSprite(scene.add.sprite(0, 0, textureKey));
  return createObjectPool(createFn, maxSize);
};

// Utility function
export const isPoolable = (obj: any): obj is Poolable => {
  return (
    obj !== null &&
    obj !== undefined &&
    typeof obj.reset === "function" &&
    typeof obj.isInUse === "function" &&
    typeof obj.setInUse === "function"
  );
};
