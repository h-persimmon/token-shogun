import { EVENT } from "@/constants";
import { IEvent } from "./interface";
import { eventList } from "./list";

/**
 * イベントに関するモジュール（Kiroが生成）
 */
export class EventModule {
  /**
   * イベント一覧
   */
  public readonly eventList: IEvent[];

  /**
   * コンストラクタ（Kiroが生成）
   */
  public constructor() {
    this.eventList = eventList;
  }

  /**
   * デフォルトのイベントを取得する関数
   * @returns なにもしないイベント
   */
  public getDefaultModule(): IEvent {
    return this.findByIdOrNull(EVENT.DO_NOTHING.ID)!;
  }

  /**
   * IDでイベントを検索する関数（Kiroが生成）
   * @param id イベントID
   * @returns イベント（見つからない場合はnull）
   */
  public findByIdOrNull(id: string): IEvent | null {
    return this.eventList.find((event) => event.id === id) || null;
  }
}
