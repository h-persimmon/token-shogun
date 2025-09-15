import { describe, expect, it } from "vitest";
import type {
  CameraControlConfig,
  CameraPosition,
  CameraState,
  DragState,
  MapBounds,
  PinchState,
  ViewportBounds,
  ZoomConfig,
  ZoomState,
} from "../camera-control-types";
import { DEFAULT_CAMERA_CONTROL_CONFIG, DEFAULT_ZOOM_CONFIG } from "../camera-control-types";

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

  it("should define ZoomState interface correctly", () => {
    const zoomState: ZoomState = {
      targetZoom: 1.5,
      minZoom: 0.5,
      maxZoom: 3.0,
      isZooming: true,
      zoomCenter: { x: 100, y: 200 },
    };

    expect(zoomState.targetZoom).toBe(1.5);
    expect(zoomState.minZoom).toBe(0.5);
    expect(zoomState.maxZoom).toBe(3.0);
    expect(zoomState.isZooming).toBe(true);
    expect(zoomState.zoomCenter.x).toBe(100);
    expect(zoomState.zoomCenter.y).toBe(200);
  });

  it("should define PinchState interface correctly", () => {
    const pinchState: PinchState = {
      isActive: true,
      initialDistance: 150,
      initialZoom: 1.0,
      centerPoint: { x: 300, y: 400 },
      touches: [
        { id: 1, x: 250, y: 350 },
        { id: 2, x: 350, y: 450 },
      ],
    };

    expect(pinchState.isActive).toBe(true);
    expect(pinchState.initialDistance).toBe(150);
    expect(pinchState.initialZoom).toBe(1.0);
    expect(pinchState.centerPoint.x).toBe(300);
    expect(pinchState.centerPoint.y).toBe(400);
    expect(pinchState.touches).toHaveLength(2);
    expect(pinchState.touches[0].id).toBe(1);
    expect(pinchState.touches[1].x).toBe(350);
  });

  it("should define ZoomConfig interface correctly", () => {
    const zoomConfig: ZoomConfig = {
      enabled: true,
      minZoom: 0.25,
      maxZoom: 4.0,
      wheelSensitivity: 0.2,
      pinchSensitivity: 1.5,
      smoothZoom: true,
      smoothZoomFactor: 0.1,
    };

    expect(zoomConfig.enabled).toBe(true);
    expect(zoomConfig.minZoom).toBe(0.25);
    expect(zoomConfig.maxZoom).toBe(4.0);
    expect(zoomConfig.wheelSensitivity).toBe(0.2);
    expect(zoomConfig.pinchSensitivity).toBe(1.5);
    expect(zoomConfig.smoothZoom).toBe(true);
    expect(zoomConfig.smoothZoomFactor).toBe(0.1);
  });

  it("should provide default zoom config", () => {
    expect(DEFAULT_ZOOM_CONFIG.enabled).toBe(true);
    expect(DEFAULT_ZOOM_CONFIG.minZoom).toBe(0.5);
    expect(DEFAULT_ZOOM_CONFIG.maxZoom).toBe(3.0);
    expect(DEFAULT_ZOOM_CONFIG.wheelSensitivity).toBe(0.1);
    expect(DEFAULT_ZOOM_CONFIG.pinchSensitivity).toBe(1.0);
    expect(DEFAULT_ZOOM_CONFIG.smoothZoom).toBe(true);
    expect(DEFAULT_ZOOM_CONFIG.smoothZoomFactor).toBe(0.15);
  });
});
