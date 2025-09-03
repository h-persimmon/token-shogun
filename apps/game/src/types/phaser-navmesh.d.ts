// Type definitions for phaser-navmesh
declare module "phaser-navmesh" {
  export interface NavMesh {
    findPath(
      start: { x: number; y: number },
      end: { x: number; y: number },
    ): Array<{ x: number; y: number }> | null;
    isPointInMesh(point: { x: number; y: number }): boolean;
  }

  export default class PhaserNavMeshPlugin extends Phaser.Plugins.ScenePlugin {
    buildMeshFromTiled(
      key: string,
      objectLayer: any,
      meshShrinkAmount?: number,
    ): NavMesh;
  }
}
