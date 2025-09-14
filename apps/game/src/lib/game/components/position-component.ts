import type { Component } from "./types";

export const positionComponentTag = "position";
export type Point = {
  x: number;
  y: number;
};

export type PositionComponent = Component<
  typeof positionComponentTag,
  {
    point: Point;
  }
>;

export const createPositionComponent = (
  x: number,
  y: number,
): PositionComponent => ({
  type: positionComponentTag,
  point: { x: x * 48 + 24, y: y * 48 + 24 },
});

export const createPositionComponentFromPoint = (
  point: Point,
): PositionComponent => ({
  type: positionComponentTag,
  point,
});

export const isPositionComponent = (
  component: Component<any, any>,
): component is PositionComponent => {
  return component.type === positionComponentTag;
};
// Component utility functions

export const updatePositionComponent = (
  position: PositionComponent,
  dx: number,
  dy: number,
): void => {
  position.point.x = position.point.x + dx;
  position.point.y = position.point.y + dy;
};
