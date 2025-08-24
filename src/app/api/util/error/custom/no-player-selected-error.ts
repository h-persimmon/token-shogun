/**
 * プレイヤーが選択されていない（ログインしていない）ことを表すエラー
 */
export class NoPlayerSelectedError extends Error {
  public constructor() {
    super("No player selected.");
  }
}
