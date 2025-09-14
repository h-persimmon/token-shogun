import { describe, expect, it } from "vitest";
import { createPositionComponent } from "../position-component";
import {
  canDeployToStructure,
  createUnitComponent,
  createUnitWithConfig,
  deployUnit,
  getUnitConfig,
  getUnitCost,
  isUnitComponent,
  isUnitDeployed,
  isUnitType,
  UNIT_CONFIGS,
  undeployUnit,
  unitComponentTag,
} from "../unit-component";

describe("UnitComponent", () => {
  describe("createUnitComponent", () => {
    it("should create a unit component with default values", () => {
      const unit = createUnitComponent("soldier");

      expect(unit.type).toBe(unitComponentTag);
      expect(unit.unitType).toBe("soldier");
      expect(unit.isDeployed).toBe(false);
      expect(unit.deployedStructureId).toBeUndefined();
    });

    it("should create a unit component with specified deployment status", () => {
      const unit = createUnitComponent("archer", true);

      expect(unit.unitType).toBe("archer");
      expect(unit.isDeployed).toBe(true);
      expect(unit.deployedStructureId).toBeUndefined();
    });
  });

  describe("isUnitComponent", () => {
    it("should return true for unit component", () => {
      const unit = createUnitComponent("mage");
      expect(isUnitComponent(unit)).toBe(true);
    });

    it("should return false for non-unit component", () => {
      const position = createPositionComponent(0, 0);
      expect(isUnitComponent(position)).toBe(false);
    });
  });

  describe("UNIT_CONFIGS", () => {
    it("should have correct configuration for soldier", () => {
      const config = UNIT_CONFIGS.soldier;
      expect(config.health).toBe(120);
      expect(config.damage).toBe(25);
      expect(config.attackRange).toBe(80);
      expect(config.attackCooldown).toBe(1000);
      expect(config.cost).toBe(50);
    });

    it("should have correct configuration for archer", () => {
      const config = UNIT_CONFIGS.archer;
      expect(config.health).toBe(80);
      expect(config.damage).toBe(35);
      expect(config.attackRange).toBe(150);
      expect(config.attackCooldown).toBe(1200);
      expect(config.cost).toBe(75);
    });

    it("should have correct configuration for mage", () => {
      const config = UNIT_CONFIGS.mage;
      expect(config.health).toBe(60);
      expect(config.damage).toBe(50);
      expect(config.attackRange).toBe(120);
      expect(config.attackCooldown).toBe(1500);
      expect(config.cost).toBe(100);
    });
  });

  describe("getUnitConfig", () => {
    it("should return correct config for each unit type", () => {
      expect(getUnitConfig("soldier")).toEqual(UNIT_CONFIGS.soldier);
      expect(getUnitConfig("archer")).toEqual(UNIT_CONFIGS.archer);
      expect(getUnitConfig("mage")).toEqual(UNIT_CONFIGS.mage);
    });
  });

  describe("deployUnit", () => {
    it("should deploy unit to structure correctly", () => {
      const unit = createUnitComponent("soldier");
      const structureId = "tower-123";

      deployUnit(unit, structureId);

      expect(unit.deployedStructureId).toBe(structureId);
      expect(unit.isDeployed).toBe(true);
    });

    it("should update deployment even if unit was already deployed", () => {
      const unit = createUnitComponent("archer", true);
      unit.deployedStructureId = "old-tower";

      const newStructureId = "new-tower-456";
      deployUnit(unit, newStructureId);

      expect(unit.deployedStructureId).toBe(newStructureId);
      expect(unit.isDeployed).toBe(true);
    });
  });

  describe("undeployUnit", () => {
    it("should undeploy unit correctly", () => {
      const unit = createUnitComponent("mage");
      deployUnit(unit, "tower-123");

      undeployUnit(unit);

      expect(unit.deployedStructureId).toBeUndefined();
      expect(unit.isDeployed).toBe(false);
    });

    it("should work on already undeployed unit", () => {
      const unit = createUnitComponent("soldier");

      undeployUnit(unit);

      expect(unit.deployedStructureId).toBeUndefined();
      expect(unit.isDeployed).toBe(false);
    });
  });

  describe("isUnitDeployed", () => {
    it("should return true for properly deployed unit", () => {
      const unit = createUnitComponent("archer");
      deployUnit(unit, "tower-123");

      expect(isUnitDeployed(unit)).toBe(true);
    });

    it("should return false for undeployed unit", () => {
      const unit = createUnitComponent("soldier");

      expect(isUnitDeployed(unit)).toBe(false);
    });

    it("should return false for unit with isDeployed true but no structure ID", () => {
      const unit = createUnitComponent("mage", true);
      // deployedStructureId is undefined

      expect(isUnitDeployed(unit)).toBe(false);
    });

    it("should return false for unit with structure ID but isDeployed false", () => {
      const unit = createUnitComponent("archer");
      unit.deployedStructureId = "tower-123";
      // isDeployed is false

      expect(isUnitDeployed(unit)).toBe(false);
    });
  });

  describe("isUnitType", () => {
    it("should return true for matching unit type", () => {
      const unit = createUnitComponent("archer");
      expect(isUnitType(unit, "archer")).toBe(true);
    });

    it("should return false for non-matching unit type", () => {
      const unit = createUnitComponent("soldier");
      expect(isUnitType(unit, "mage")).toBe(false);
    });
  });

  describe("getUnitCost", () => {
    it("should return correct cost for each unit type", () => {
      expect(getUnitCost("soldier")).toBe(50);
      expect(getUnitCost("archer")).toBe(75);
      expect(getUnitCost("mage")).toBe(100);
    });
  });

  describe("createUnitWithConfig", () => {
    it("should create unit component with config", () => {
      const result = createUnitWithConfig("soldier");

      expect(result.unit.unitType).toBe("soldier");
      expect(result.unit.isDeployed).toBe(false);
      expect(result.config).toEqual(UNIT_CONFIGS.soldier);
    });

    it("should create unit with specified deployment status", () => {
      const result = createUnitWithConfig("archer", true);

      expect(result.unit.isDeployed).toBe(true);
      expect(result.config).toEqual(UNIT_CONFIGS.archer);
    });

    it("should create different unit types correctly", () => {
      const soldierResult = createUnitWithConfig("soldier");
      const archerResult = createUnitWithConfig("archer");
      const mageResult = createUnitWithConfig("mage");

      expect(soldierResult.unit.unitType).toBe("soldier");
      expect(soldierResult.config.damage).toBe(25);

      expect(archerResult.unit.unitType).toBe("archer");
      expect(archerResult.config.attackRange).toBe(150);

      expect(mageResult.unit.unitType).toBe("mage");
      expect(mageResult.config.damage).toBe(50);
    });
  });

  describe("canDeployToStructure", () => {
    it("should return true for undeployed unit", () => {
      const unit = createUnitComponent("soldier");

      expect(canDeployToStructure(unit, "tower-123")).toBe(true);
    });

    it("should return false for already deployed unit", () => {
      const unit = createUnitComponent("archer");
      deployUnit(unit, "tower-456");

      expect(canDeployToStructure(unit, "tower-789")).toBe(false);
    });

    it("should return false for unit with deployment flag but no structure", () => {
      const unit = createUnitComponent("mage", true);

      expect(canDeployToStructure(unit, "tower-123")).toBe(false);
    });

    it("should return false for unit with structure but no deployment flag", () => {
      const unit = createUnitComponent("soldier");
      unit.deployedStructureId = "tower-456";

      expect(canDeployToStructure(unit, "tower-789")).toBe(false);
    });
  });
});
