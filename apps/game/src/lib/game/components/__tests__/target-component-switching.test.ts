import { beforeEach, describe, expect, it } from "vitest";
import {
  canSwitchTargets,
  clearTargetSwitchingState,
  createTargetComponent,
  getOriginalTargetId,
  getSwitchReason,
  hasTargetSwitched,
  restoreOriginalTarget,
  setCanSwitchTarget,
  setEntityTarget,
  storeOriginalTarget,
  switchToNewTarget,
  type TargetComponent,
} from "../target-component";

describe("TargetComponent Target Switching", () => {
  let targetComponent: TargetComponent;

  beforeEach(() => {
    targetComponent = createTargetComponent("entity", 5);
    setEntityTarget(targetComponent, "original-target");
  });

  describe("storeOriginalTarget", () => {
    it("should store the original target when switching for the first time", () => {
      storeOriginalTarget(targetComponent, "attack");

      expect(targetComponent.originalTargetId).toBe("original-target");
      expect(targetComponent.switchReason).toBe("attack");
    });

    it("should not overwrite existing original target", () => {
      storeOriginalTarget(targetComponent, "attack");
      setEntityTarget(targetComponent, "second-target");
      storeOriginalTarget(targetComponent, "proximity");

      expect(targetComponent.originalTargetId).toBe("original-target");
      expect(targetComponent.switchReason).toBe("proximity");
    });

    it("should not store original target if no current target exists", () => {
      targetComponent.targetEntityId = undefined;
      storeOriginalTarget(targetComponent, "attack");

      expect(targetComponent.originalTargetId).toBeUndefined();
      expect(targetComponent.switchReason).toBe("attack");
    });
  });

  describe("restoreOriginalTarget", () => {
    it("should restore the original target successfully", () => {
      storeOriginalTarget(targetComponent, "attack");
      setEntityTarget(targetComponent, "new-target");

      const restored = restoreOriginalTarget(targetComponent);

      expect(restored).toBe(true);
      expect(targetComponent.targetEntityId).toBe("original-target");
      expect(targetComponent.targetType).toBe("entity");
      expect(targetComponent.originalTargetId).toBeUndefined();
      expect(targetComponent.switchReason).toBeUndefined();
    });

    it("should return false when no original target exists", () => {
      const restored = restoreOriginalTarget(targetComponent);

      expect(restored).toBe(false);
      expect(targetComponent.targetEntityId).toBe("original-target");
    });
  });

  describe("clearTargetSwitchingState", () => {
    it("should clear all target switching state", () => {
      storeOriginalTarget(targetComponent, "attack");
      setCanSwitchTarget(targetComponent, false);

      clearTargetSwitchingState(targetComponent);

      expect(targetComponent.originalTargetId).toBeUndefined();
      expect(targetComponent.switchReason).toBeUndefined();
      expect(targetComponent.canSwitchTarget).toBeUndefined();
    });
  });

  describe("hasTargetSwitched", () => {
    it("should return true when target has switched", () => {
      storeOriginalTarget(targetComponent, "attack");
      expect(hasTargetSwitched(targetComponent)).toBe(true);
    });

    it("should return false when target has not switched", () => {
      expect(hasTargetSwitched(targetComponent)).toBe(false);
    });
  });

  describe("canSwitchTargets", () => {
    it("should return true by default", () => {
      expect(canSwitchTargets(targetComponent)).toBe(true);
    });

    it("should return false when explicitly set to false", () => {
      setCanSwitchTarget(targetComponent, false);
      expect(canSwitchTargets(targetComponent)).toBe(false);
    });

    it("should return true when explicitly set to true", () => {
      setCanSwitchTarget(targetComponent, true);
      expect(canSwitchTargets(targetComponent)).toBe(true);
    });
  });

  describe("switchToNewTarget", () => {
    it("should switch to new target and preserve original", () => {
      switchToNewTarget(targetComponent, "new-target", "attack", 8);

      expect(targetComponent.targetEntityId).toBe("new-target");
      expect(targetComponent.originalTargetId).toBe("original-target");
      expect(targetComponent.switchReason).toBe("attack");
      expect(targetComponent.priority).toBe(8);
    });

    it("should not overwrite original target on subsequent switches", () => {
      switchToNewTarget(targetComponent, "first-switch", "attack");
      switchToNewTarget(targetComponent, "second-switch", "proximity");

      expect(targetComponent.targetEntityId).toBe("second-switch");
      expect(targetComponent.originalTargetId).toBe("original-target");
      expect(targetComponent.switchReason).toBe("proximity");
    });
  });

  describe("getSwitchReason", () => {
    it("should return the current switch reason", () => {
      storeOriginalTarget(targetComponent, "threat");
      expect(getSwitchReason(targetComponent)).toBe("threat");
    });

    it("should return undefined when no switch has occurred", () => {
      expect(getSwitchReason(targetComponent)).toBeUndefined();
    });
  });

  describe("getOriginalTargetId", () => {
    it("should return the original target ID", () => {
      storeOriginalTarget(targetComponent, "attack");
      expect(getOriginalTargetId(targetComponent)).toBe("original-target");
    });

    it("should return undefined when no original target exists", () => {
      expect(getOriginalTargetId(targetComponent)).toBeUndefined();
    });
  });
});
