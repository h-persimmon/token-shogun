import { describe, expect, it } from "vitest";
import {
  applyStun,
  clearStun,
  createMovementComponent,
  isStunned,
  type MovementComponent,
  resumeFromCombat,
  stopForCombat,
} from "../movement-component";

describe("MovementComponent - Combat Features", () => {
  describe("createMovementComponent", () => {
    it("should initialize combat-related fields with default values", () => {
      const movement = createMovementComponent();

      expect(movement.isStoppedForCombat).toBe(false);
      expect(movement.originalTarget).toBeUndefined();
      expect(movement.stunEndTime).toBeUndefined();
    });
  });

  describe("stopForCombat", () => {
    it("should stop movement for combat and preserve original target", () => {
      const movement = createMovementComponent();
      movement.targetPosition = { x: 100, y: 200 };
      movement.isMoving = true;

      stopForCombat(movement);

      expect(movement.isStoppedForCombat).toBe(true);
      expect(movement.isMoving).toBe(false);
      expect(movement.originalTarget).toEqual({ x: 100, y: 200 });
    });

    it("should not overwrite existing originalTarget", () => {
      const movement = createMovementComponent();
      movement.targetPosition = { x: 100, y: 200 };
      movement.originalTarget = { x: 50, y: 100 };
      movement.isMoving = true;

      stopForCombat(movement);

      expect(movement.isStoppedForCombat).toBe(true);
      expect(movement.isMoving).toBe(false);
      expect(movement.originalTarget).toEqual({ x: 50, y: 100 }); // 元の値を保持
    });

    it("should not preserve target when preserveOriginalTarget is false", () => {
      const movement = createMovementComponent();
      movement.targetPosition = { x: 100, y: 200 };
      movement.isMoving = true;

      stopForCombat(movement, false);

      expect(movement.isStoppedForCombat).toBe(true);
      expect(movement.isMoving).toBe(false);
      expect(movement.originalTarget).toBeUndefined();
    });
  });

  describe("resumeFromCombat", () => {
    it("should resume movement to original target", () => {
      const movement = createMovementComponent();
      movement.isStoppedForCombat = true;
      movement.originalTarget = { x: 100, y: 200 };

      resumeFromCombat(movement);

      expect(movement.isStoppedForCombat).toBe(false);
      expect(movement.targetPosition).toEqual({ x: 100, y: 200 });
      expect(movement.isMoving).toBe(true);
      expect(movement.originalTarget).toBeUndefined();
    });

    it("should not resume movement if no original target exists", () => {
      const movement = createMovementComponent();
      movement.isStoppedForCombat = true;
      movement.originalTarget = undefined;

      resumeFromCombat(movement);

      expect(movement.isStoppedForCombat).toBe(false);
      expect(movement.targetPosition).toBeNull();
      expect(movement.isMoving).toBe(false);
    });
  });

  describe("applyStun", () => {
    it("should apply stun effect with correct duration", () => {
      const movement = createMovementComponent();
      movement.targetPosition = { x: 100, y: 200 };
      movement.isMoving = true;
      const currentTime = 1000;
      const stunDuration = 500;

      applyStun(movement, stunDuration, currentTime);

      expect(movement.stunEndTime).toBe(1500);
      expect(movement.isMoving).toBe(false);
      expect(movement.isStoppedForCombat).toBe(true);
      expect(movement.originalTarget).toEqual({ x: 100, y: 200 });
    });

    it("should not overwrite existing originalTarget when applying stun", () => {
      const movement = createMovementComponent();
      movement.targetPosition = { x: 100, y: 200 };
      movement.originalTarget = { x: 50, y: 100 };
      movement.isStoppedForCombat = true;
      const currentTime = 1000;
      const stunDuration = 500;

      applyStun(movement, stunDuration, currentTime);

      expect(movement.stunEndTime).toBe(1500);
      expect(movement.originalTarget).toEqual({ x: 50, y: 100 }); // 元の値を保持
    });
  });

  describe("isStunned", () => {
    it("should return true when unit is stunned", () => {
      const movement = createMovementComponent();
      movement.stunEndTime = 1500;
      const currentTime = 1000;

      expect(isStunned(movement, currentTime)).toBe(true);
    });

    it("should return false when stun has expired", () => {
      const movement = createMovementComponent();
      movement.stunEndTime = 1000;
      const currentTime = 1500;

      expect(isStunned(movement, currentTime)).toBe(false);
    });

    it("should return false when no stun is applied", () => {
      const movement = createMovementComponent();
      const currentTime = 1000;

      expect(isStunned(movement, currentTime)).toBe(false);
    });
  });

  describe("clearStun", () => {
    it("should clear stun effect", () => {
      const movement = createMovementComponent();
      movement.stunEndTime = 1500;

      clearStun(movement);

      expect(movement.stunEndTime).toBeUndefined();
    });

    it("should not affect combat stop state when clearing stun", () => {
      const movement = createMovementComponent();
      movement.stunEndTime = 1500;
      movement.isStoppedForCombat = true;

      clearStun(movement);

      expect(movement.stunEndTime).toBeUndefined();
      expect(movement.isStoppedForCombat).toBe(true); // 戦闘停止状態は保持
    });
  });
});
