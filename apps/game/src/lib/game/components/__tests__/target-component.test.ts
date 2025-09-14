import { describe, expect, it } from "vitest";
import { createPositionComponent } from "../position-component";
import {
  clearTarget,
  createTargetComponent,
  evaluateTargetPriority,
  hasValidTarget,
  isTargetComponent,
  setEntityTarget,
  setPositionTarget,
  targetComponentTag,
} from "../target-component";

describe("TargetComponent", () => {
  describe("createTargetComponent", () => {
    it("should create a target component with default values", () => {
      const target = createTargetComponent();

      expect(target.type).toBe(targetComponentTag);
      expect(target.targetType).toBe("none");
      expect(target.priority).toBe(5);
      expect(target.targetEntityId).toBeUndefined();
      expect(target.targetPosition).toBeUndefined();
    });

    it("should create a target component with specified values", () => {
      const target = createTargetComponent("entity", 8);

      expect(target.targetType).toBe("entity");
      expect(target.priority).toBe(8);
    });
  });

  describe("isTargetComponent", () => {
    it("should return true for target component", () => {
      const target = createTargetComponent();
      expect(isTargetComponent(target)).toBe(true);
    });

    it("should return false for non-target component", () => {
      const position = createPositionComponent(0, 0);
      expect(isTargetComponent(position)).toBe(false);
    });
  });

  describe("setEntityTarget", () => {
    it("should set entity target correctly", () => {
      const target = createTargetComponent();
      setEntityTarget(target, "enemy-123", 7);

      expect(target.targetEntityId).toBe("enemy-123");
      expect(target.targetType).toBe("entity");
      expect(target.priority).toBe(7);
      expect(target.targetPosition).toBeUndefined();
    });

    it("should set entity target without changing priority", () => {
      const target = createTargetComponent("none", 3);
      setEntityTarget(target, "enemy-456");

      expect(target.targetEntityId).toBe("enemy-456");
      expect(target.priority).toBe(3);
    });

    it("should clamp priority to valid range", () => {
      const target = createTargetComponent();
      setEntityTarget(target, "enemy-123", 15);
      expect(target.priority).toBe(10);

      setEntityTarget(target, "enemy-456", -5);
      expect(target.priority).toBe(0);
    });
  });

  describe("setPositionTarget", () => {
    it("should set position target correctly", () => {
      const target = createTargetComponent();
      const position = { x: 100, y: 200 };
      setPositionTarget(target, position, 6);

      expect(target.targetPosition).toEqual(position);
      expect(target.targetType).toBe("position");
      expect(target.priority).toBe(6);
      expect(target.targetEntityId).toBeUndefined();
    });

    it("should create a copy of the position", () => {
      const target = createTargetComponent();
      const position = { x: 100, y: 200 };
      setPositionTarget(target, position);

      position.x = 300;
      expect(target.targetPosition?.x).toBe(100);
    });
  });

  describe("clearTarget", () => {
    it("should clear all target data", () => {
      const target = createTargetComponent();
      setEntityTarget(target, "enemy-123", 8);

      clearTarget(target);

      expect(target.targetEntityId).toBeUndefined();
      expect(target.targetPosition).toBeUndefined();
      expect(target.targetType).toBe("none");
    });
  });

  describe("hasValidTarget", () => {
    it("should return false for no target", () => {
      const target = createTargetComponent();
      expect(hasValidTarget(target)).toBe(false);
    });

    it("should return true for valid entity target", () => {
      const target = createTargetComponent();
      setEntityTarget(target, "enemy-123");
      expect(hasValidTarget(target)).toBe(true);
    });

    it("should return true for valid position target", () => {
      const target = createTargetComponent();
      setPositionTarget(target, { x: 100, y: 200 });
      expect(hasValidTarget(target)).toBe(true);
    });

    it("should return false for invalid entity target", () => {
      const target = createTargetComponent();
      target.targetType = "entity";
      // targetEntityId is undefined
      expect(hasValidTarget(target)).toBe(false);
    });

    it("should return false for invalid position target", () => {
      const target = createTargetComponent();
      target.targetType = "position";
      // targetPosition is undefined
      expect(hasValidTarget(target)).toBe(false);
    });
  });

  describe("evaluateTargetPriority", () => {
    it("should return 0 for invalid target", () => {
      const target = createTargetComponent();
      expect(evaluateTargetPriority(target, 100)).toBe(0);
    });

    it("should calculate priority correctly for valid target", () => {
      const target = createTargetComponent();
      setEntityTarget(target, "enemy-123", 10);

      const score1 = evaluateTargetPriority(target, 100);
      const score2 = evaluateTargetPriority(target, 50);

      expect(score2).toBeGreaterThan(score1); // 距離が近いほど高い評価
    });

    it("should handle zero distance", () => {
      const target = createTargetComponent();
      setEntityTarget(target, "enemy-123", 5);

      const score = evaluateTargetPriority(target, 0);
      expect(score).toBe(0.5); // priority 5 / 10 = 0.5
    });

    it("should consider priority in evaluation", () => {
      const highPriorityTarget = createTargetComponent();
      const lowPriorityTarget = createTargetComponent();

      setEntityTarget(highPriorityTarget, "enemy-1", 10);
      setEntityTarget(lowPriorityTarget, "enemy-2", 2);

      const highScore = evaluateTargetPriority(highPriorityTarget, 100);
      const lowScore = evaluateTargetPriority(lowPriorityTarget, 100);

      expect(highScore).toBeGreaterThan(lowScore);
    });
  });
});
