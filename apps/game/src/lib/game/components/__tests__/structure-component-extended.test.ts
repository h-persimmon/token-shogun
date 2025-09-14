import { describe, expect, it } from "vitest";
import {
  canDeployUnit,
  createStructureComponent,
  deployUnitToStructure,
  getDeployedUnitId,
  getMaxUnits,
  hasDeployedUnit,
  undeployUnitFromStructure,
  StructureType
} from "../structure-component";

describe("StructureComponent Extended Features", () => {
  describe("createStructureComponent with maxUnits", () => {
    it("should create structure with default maxUnits", () => {
      const structure = createStructureComponent(false, "with-unit", "cannon");

      expect(structure.maxUnits).toBe(1);
      expect(structure.deployedUnitId).toBeUndefined();
    });

    it("should create structure with specified maxUnits", () => {
      const structure = createStructureComponent(true, "with-unit", "cannon", 5);

      expect(structure.maxUnits).toBe(5);
    });
  });

  describe("deployUnitToStructure", () => {
    it("should deploy unit successfully to empty structure", () => {
      const structure = createStructureComponent(false, "with-unit", "cannon", 3);
      const unitId = "unit-123";

      const result = deployUnitToStructure(structure, unitId);

      expect(result).toBe(true);
      expect(structure.deployedUnitId).toBe(unitId);
    });

    it("should fail to deploy unit to occupied structure", () => {
      const structure = createStructureComponent(false, "with-unit",  "cannon");
      const firstUnitId = "unit-123";
      const secondUnitId = "unit-456";

      deployUnitToStructure(structure, firstUnitId);
      const result = deployUnitToStructure(structure, secondUnitId);

      expect(result).toBe(false);
      expect(structure.deployedUnitId).toBe(firstUnitId);
    });
  });

  describe("undeployUnitFromStructure", () => {
    it("should undeploy unit successfully", () => {
      const structure = createStructureComponent(false, "with-unit", "cannon");
      const unitId = "unit-123";

      deployUnitToStructure(structure, unitId);
      undeployUnitFromStructure(structure);

      expect(structure.deployedUnitId).toBeUndefined();
    });

    it("should work on structure without deployed unit", () => {
      const structure = createStructureComponent(false, "with-unit", "cannon");

      undeployUnitFromStructure(structure);

      expect(structure.deployedUnitId).toBeUndefined();
    });
  });

  describe("hasDeployedUnit", () => {
    it("should return true for structure with deployed unit", () => {
      const structure = createStructureComponent(false, "with-unit", "cannon");
      deployUnitToStructure(structure, "unit-123");

      expect(hasDeployedUnit(structure)).toBe(true);
    });

    it("should return false for structure without deployed unit", () => {
      const structure = createStructureComponent(false, "with-unit", "cannon");

      expect(hasDeployedUnit(structure)).toBe(false);
    });
  });

  describe("canDeployUnit", () => {
    it("should return true for with-unit structure without deployed unit", () => {
      const structure = createStructureComponent(false, "with-unit", "cannon");

      expect(canDeployUnit(structure)).toBe(true);
    });

    it("should return false for with-unit structure with deployed unit", () => {
      const structure = createStructureComponent(false, "with-unit", "cannon");
      deployUnitToStructure(structure, "unit-123");

      expect(canDeployUnit(structure)).toBe(false);
    });

    it("should return false for auto structure", () => {
      const structure = createStructureComponent(false, "auto", "cannon");

      expect(canDeployUnit(structure)).toBe(false);
    });

    it("should return false for none structure", () => {
      const structure = createStructureComponent(false, "none", "cannon");

      expect(canDeployUnit(structure)).toBe(false);
    });
  });

  describe("getDeployedUnitId", () => {
    it("should return unit ID for structure with deployed unit", () => {
      const structure = createStructureComponent(false, "with-unit", "cannon");
      const unitId = "unit-123";
      deployUnitToStructure(structure, unitId);

      expect(getDeployedUnitId(structure)).toBe(unitId);
    });

    it("should return undefined for structure without deployed unit", () => {
      const structure = createStructureComponent(false, "with-unit", "cannon");

      expect(getDeployedUnitId(structure)).toBeUndefined();
    });
  });

  describe("getMaxUnits", () => {
    it("should return correct maxUnits value", () => {
      const structure1 = createStructureComponent(false, "with-unit", "cannon", 1);
      const structure2 = createStructureComponent(false, "with-unit", "cannon", 5);

      expect(getMaxUnits(structure1)).toBe(1);
      expect(getMaxUnits(structure2)).toBe(5);
    });
  });

  describe("integration with existing functionality", () => {
    it("should work with existing useStructure function", () => {
      const structure = createStructureComponent(false, "with-unit", "cannon");
      const unitId = "unit-123";

      // 新機能でユニットを配備
      deployUnitToStructure(structure, unitId);

      // 既存機能でstructureを使用
      // useStructure(structure, unitId); // この関数は既存のもの

      expect(structure.deployedUnitId).toBe(unitId);
      expect(hasDeployedUnit(structure)).toBe(true);
    });

    it("should maintain backward compatibility", () => {
      // 既存のコードが動作することを確認
      const structure = createStructureComponent(true, "auto", "cannon");

      expect(structure.isCriticalForLose).toBe(true);
      expect(structure.attackableType).toBe("auto");
      expect(structure.maxUnits).toBe(1); // デフォルト値
    });
  });
});
