# Design Document

## Overview

This design extends the existing camera control system to add zoom functionality with pinch and pan controls. The implementation will integrate seamlessly with the current `CameraControlSystem` while adding new zoom capabilities for both touch devices (pinch gestures) and desktop devices (mouse wheel). The design maintains the existing ECS architecture and follows the established patterns in the codebase.

## Architecture

### System Integration

The zoom functionality will be implemented as an extension to the existing `CameraControlSystem` rather than a separate system to ensure tight integration and avoid conflicts:

```
CameraControlSystem (Extended)
├── Existing Pan Controls
│   ├── Mouse drag functionality
│   ├── Boundary constraints
│   └── Cursor state management
└── New Zoom Controls
    ├── Pinch gesture handling
    ├── Mouse wheel handling
    ├── Zoom level management
    └── Focus point calculation
```

### Component Architecture

```typescript
// Extended interfaces for zoom functionality
interface ZoomState {
  currentZoom: number;
  targetZoom: number;
  minZoom: number;
  maxZoom: number;
  isZooming: boolean;
  zoomCenter: { x: number; y: number };
}

interface PinchState {
  isActive: boolean;
  initialDistance: number;
  initialZoom: number;
  centerPoint: { x: number; y: number };
  touches: { id: number; x: number; y: number }[];
}

interface ZoomConfig {
  enabled: boolean;
  minZoom: number;
  maxZoom: number;
  wheelSensitivity: number;
  pinchSensitivity: number;
  smoothZoom: boolean;
  smoothZoomFactor: number;
}
```

## Components and Interfaces

### ZoomState Interface

```typescript
interface ZoomState {
  /** Target zoom level for smooth transitions (Phaser camera.zoom will hold current) */
  targetZoom: number;
  /** Minimum allowed zoom level */
  minZoom: number;
  /** Maximum allowed zoom level */
  maxZoom: number;
  /** Whether zoom operation is currently active */
  isZooming: boolean;
  /** Center point for zoom operations in world coordinates */
  zoomCenter: { x: number; y: number };
}
```

### PinchState Interface

```typescript
interface PinchState {
  /** Whether pinch gesture is currently active */
  isActive: boolean;
  /** Initial distance between touch points when pinch started */
  initialDistance: number;
  /** Zoom level when pinch gesture started */
  initialZoom: number;
  /** Center point between the two touch points */
  centerPoint: { x: number; y: number };
  /** Array of active touch points */
  touches: Array<{
    id: number;
    x: number;
    y: number;
  }>;
}
```

### ZoomConfig Interface

```typescript
interface ZoomConfig {
  /** Enable/disable zoom functionality */
  enabled: boolean;
  /** Minimum zoom level (default: 0.5) */
  minZoom: number;
  /** Maximum zoom level (default: 3.0) */
  maxZoom: number;
  /** Mouse wheel sensitivity (default: 0.1) */
  wheelSensitivity: number;
  /** Pinch gesture sensitivity (default: 1.0) */
  pinchSensitivity: number;
  /** Enable smooth zoom transitions */
  smoothZoom: boolean;
  /** Smooth zoom interpolation factor (default: 0.15) */
  smoothZoomFactor: number;
}
```

## Data Models

### Extended CameraControlSystem Class

```typescript
class CameraControlSystem {
  // Existing properties...
  private zoomState: ZoomState;
  private pinchState: PinchState;
  private zoomConfig: ZoomConfig;
  
  // Extended constructor
  constructor(
    scene: Phaser.Scene, 
    mapBounds: MapBounds, 
    config?: Partial<CameraControlConfig & ZoomConfig>
  );
  
  // New public methods
  public setZoomLevel(zoom: number, centerX?: number, centerY?: number): void;
  public getZoomLevel(): number; // Returns this.camera.zoom
  public setZoomLimits(minZoom: number, maxZoom: number): void;
  public zoomIn(factor?: number, centerX?: number, centerY?: number): void;
  public zoomOut(factor?: number, centerX?: number, centerY?: number): void;
  public resetZoom(): void;
  
  // New private methods
  private setupZoomInputHandlers(): void;
  private handleWheelEvent(event: WheelEvent): void;
  private handleTouchStart(event: TouchEvent): void;
  private handleTouchMove(event: TouchEvent): void;
  private handleTouchEnd(event: TouchEvent): void;
  private updatePinchGesture(touches: Touch[]): void;
  private calculatePinchDistance(touch1: Touch, touch2: Touch): number;
  private calculatePinchCenter(touch1: Touch, touch2: Touch): { x: number; y: number };
  private updateZoomLevel(newZoom: number, centerX: number, centerY: number): void;
  private clampZoomLevel(zoom: number): number;
  private updateCameraBoundsForZoom(): void;
  
  // Leverage Phaser's built-in zoom and coordinate conversion
  private zoomToPoint(zoom: number, x: number, y: number): void; // Uses camera.pan and camera.setZoom
}
```

### Zoom Utility Functions

```typescript
class ZoomUtils {
  /**
   * Leverage Phaser's camera.getWorldPoint() for screen to world conversion
   */
  static getWorldPointFromScreen(
    camera: Phaser.Cameras.Scene2D.Camera,
    screenX: number,
    screenY: number
  ): Phaser.Math.Vector2;
  
  /**
   * Use Phaser's camera bounds system with zoom consideration
   */
  static calculateZoomedBounds(
    mapBounds: MapBounds,
    zoom: number,
    camera: Phaser.Cameras.Scene2D.Camera
  ): { minX: number; maxX: number; minY: number; maxY: number };
  
  /**
   * Validate zoom level against configured limits
   */
  static validateZoomLevel(zoom: number, minZoom: number, maxZoom: number): number;
  
  /**
   * Use Phaser's camera.pan() method for smooth zoom to point
   */
  static smoothZoomToPoint(
    camera: Phaser.Cameras.Scene2D.Camera,
    zoom: number,
    worldX: number,
    worldY: number,
    duration?: number
  ): void;
}
```

## Error Handling

### Zoom-Specific Error Cases

1. **Invalid Zoom Levels**
   - Zoom values outside configured limits are clamped to valid range
   - NaN or infinite zoom values default to 1.0 (normal zoom)
   - Negative zoom values are converted to absolute values

2. **Touch Input Errors**
   - Invalid touch events are ignored gracefully
   - Pinch gestures with insufficient touch points are cancelled
   - Touch coordinate validation prevents crashes

3. **Camera Boundary Conflicts**
   - Zoom operations that would move camera outside map bounds are adjusted
   - Camera position is recalculated when zoom changes affect boundaries
   - Smooth transitions handle boundary conflicts gracefully

4. **Performance Issues**
   - Zoom operations are throttled to prevent excessive updates
   - Smooth zoom transitions are cancelled if performance drops
   - Touch event processing is optimized for mobile devices

### Error Handling Implementation

```typescript
// Zoom error types
enum ZoomError {
  INVALID_ZOOM_LEVEL = "INVALID_ZOOM_LEVEL",
  TOUCH_INPUT_ERROR = "TOUCH_INPUT_ERROR",
  BOUNDARY_CONFLICT = "BOUNDARY_CONFLICT",
  PERFORMANCE_ISSUE = "PERFORMANCE_ISSUE"
}

// Safe zoom level setting with validation using Phaser methods
private safeSetZoomLevel(zoom: number, centerX: number, centerY: number): void {
  try {
    // Validate zoom level
    const validZoom = this.clampZoomLevel(zoom);
    if (validZoom !== zoom) {
      this.logWarning(ZoomError.INVALID_ZOOM_LEVEL, `Zoom clamped from ${zoom} to ${validZoom}`);
    }
    
    // Use Phaser's built-in zoom methods
    if (this.zoomConfig.smoothZoom) {
      // Use Phaser's smooth zoom with pan to point
      const worldPoint = this.camera.getWorldPoint(centerX, centerY);
      this.camera.pan(worldPoint.x, worldPoint.y, 200, 'Power2');
      this.camera.zoomTo(validZoom, 200);
    } else {
      // Immediate zoom using Phaser's setZoom
      this.zoomToPoint(validZoom, centerX, centerY);
    }
    
    this.zoomState.targetZoom = validZoom;
  } catch (error) {
    this.logError(ZoomError.INVALID_ZOOM_LEVEL, "Failed to set zoom level", error);
    // Reset to safe zoom level using Phaser
    this.camera.setZoom(1.0);
    this.zoomState.targetZoom = 1.0;
  }
}
```

## Implementation Strategy

### Phase 1: Core Zoom Infrastructure

1. **Extend existing interfaces** - Add zoom-related properties to existing types
2. **Implement zoom state management** - Add zoom state tracking using Phaser's camera.zoom
3. **Add basic zoom methods** - Implement setZoomLevel using camera.setZoom(), getZoomLevel using camera.zoom
4. **Integrate with existing boundary system** - Use Phaser's camera bounds with zoom consideration

### Phase 2: Mouse Wheel Support

1. **Add wheel event handlers** - Implement mouse wheel zoom using Phaser's input system
2. **Implement zoom focus calculation** - Use camera.getWorldPoint() for cursor position conversion
3. **Add smooth zoom transitions** - Use Phaser's camera.pan() and camera.zoomTo() methods
4. **Test boundary integration** - Verify zoom works with Phaser's camera bounds system

### Phase 3: Touch Gesture Support

1. **Implement touch event handlers** - Use Phaser's pointer system for multi-touch support
2. **Add pinch gesture detection** - Leverage Phaser's pointer distance calculations
3. **Implement pinch zoom logic** - Use camera.getWorldPoint() for touch coordinate conversion
4. **Handle gesture conflicts** - Use Phaser's input priority system to manage conflicts

### Phase 4: Integration and Polish

1. **Integrate with existing systems** - Ensure compatibility with other game systems
2. **Add configuration options** - Implement zoom sensitivity and limit configuration
3. **Performance optimization** - Optimize for smooth performance on all devices
4. **Error handling and validation** - Add comprehensive error handling and input validation

## Integration with Existing Systems

### CameraControlSystem Integration

The zoom functionality will be added directly to the existing `CameraControlSystem` class:

- **Shared state management** - Zoom state will be managed alongside existing camera state
- **Unified input handling** - Touch and mouse events will be processed in the same system
- **Consistent error handling** - Zoom errors will use the same logging and recovery patterns
- **Configuration integration** - Zoom config will extend the existing camera config interface

### Boundary System Compatibility

The existing boundary system will be extended to work with zoom levels:

- **Dynamic boundary calculation** - Map boundaries will be recalculated based on current zoom
- **Zoom-aware clamping** - Camera position clamping will consider zoom level
- **Smooth boundary transitions** - Boundary changes during zoom will be handled smoothly

### Game Scene Integration

Integration with the existing `GameScene` class will be minimal:

- **No API changes** - Existing camera control initialization will remain the same
- **Optional zoom config** - Zoom functionality can be enabled/disabled via configuration
- **Backward compatibility** - Existing games will work without modification

## Performance Considerations

### Optimization Strategies

1. **Event Throttling**
   - Mouse wheel events are throttled to prevent excessive zoom updates
   - Touch move events are debounced to reduce processing overhead
   - Smooth zoom updates are limited to 60fps maximum

2. **Efficient Calculations**
   - Zoom focus calculations are cached when possible
   - Boundary calculations are only updated when zoom level changes
   - Touch distance calculations use optimized math functions

3. **Memory Management**
   - Touch event objects are reused to prevent garbage collection
   - Zoom state objects are pre-allocated and reused
   - Event listeners are properly cleaned up on system destruction

### Mobile Device Considerations

- **Touch event optimization** - Touch events are processed efficiently for mobile performance
- **Gesture recognition** - Pinch gestures are detected with minimal computational overhead
- **Battery efficiency** - Zoom operations are optimized to minimize battery drain
- **Responsive feedback** - Zoom operations provide immediate visual feedback
