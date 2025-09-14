import { describe, expect, it } from "vitest";
import type {
  CameraControlConfig,
  CameraPosition,
  CameraState,
  DragState,
  MapBounds,
  ViewportBounds,
} from "../camera-control-types";
import { DEFAULT_CAMERA_CONTROL_CONFIG } from "../camera-control-types";

describe("Camera Control Types", () => {
  it("should define MapBounds interface correctly", () => {
    const mapBounds: MapBounds = {
      width: 1920,
      height: 1080,
      tileWidth: 32,
      tileHeight: 32,
    };

    expect(mapBounds.width).toBe(1920);
    expect(mapBounds.height).toBe(1080);
    expect(mapBounds.tileWidth).toBe(32);
    expect(mapBounds.tileHeight).toBe(32);
  });

  it("should define CameraState interface correctly", () => {
    const cameraState: CameraState = {
      x: 100,
      y: 200,
      isDragging: false,
      canMove: true,
    };

    expect(cameraState.x).toBe(100);
    expect(cameraState.y).toBe(200);
    expect(cameraState.isDragging).toBe(false);
    expect(cameraState.canMove).toBe(true);
  });

  it("should define DragState interface correctly", () => {
    const dragState: DragState = {
      startX: 50,
      startY: 75,
      lastX: 60,
      lastY: 85,
      isActive: true,
    };

    expect(dragState.startX).toBe(50);
    expect(dragState.startY).toBe(75);
    expect(dragState.lastX).toBe(60);
    expect(dragState.lastY).toBe(85);
    expect(dragState.isActive).toBe(true);
  });

  it("should define CameraControlConfig interface correctly", () => {
    const config: CameraControlConfig = {
      enabled: true,
      dragSensitivity: 1.5,
      boundaryPadding: 10,
      smoothing: true,
      smoothingFactor: 0.2,
    };

    expect(config.enabled).toBe(true);
    expect(config.dragSensitivity).toBe(1.5);
    expect(config.boundaryPadding).toBe(10);
    expect(config.smoothing).toBe(true);
    expect(config.smoothingFactor).toBe(0.2);
  });

  it("should provide default camera control config", () => {
    expect(DEFAULT_CAMERA_CONTROL_CONFIG.enabled).toBe(true);
    expect(DEFAULT_CAMERA_CONTROL_CONFIG.dragSensitivity).toBe(1.0);
    expect(DEFAULT_CAMERA_CONTROL_CONFIG.boundaryPadding).toBe(0);
    expect(DEFAULT_CAMERA_CONTROL_CONFIG.smoothing).toBe(false);
    expect(DEFAULT_CAMERA_CONTROL_CONFIG.smoothingFactor).toBe(0.1);
  });

  it("should define CameraPosition type correctly", () => {
    const position: CameraPosition = {
      x: 300,
      y: 400,
    };

    expect(position.x).toBe(300);
    expect(position.y).toBe(400);
  });

  it("should define ViewportBounds type correctly", () => {
    const viewportBounds: ViewportBounds = {
      width: 800,
      height: 600,
    };

    expect(viewportBounds.width).toBe(800);
    expect(viewportBounds.height).toBe(600);
  });
});
