/**
 * イベントに関するインターフェース
 */
export interface IEvent {
  /**
   * ID
   */
  readonly id: string;

  /**
   * 名前
   */
  readonly name: string;

  /**
   * タグ
   */
  readonly tags: readonly string[];
}
