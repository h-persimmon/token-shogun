/**
 * 指定されたIDのリソースが見つからないことを表すエラー
 */
export class ResourceNotFoundError extends Error {
  public constructor(resourceName: string, id: string) {
    super(`Resource ${resourceName} (ID: "${id}") is not found.`);
  }
}
