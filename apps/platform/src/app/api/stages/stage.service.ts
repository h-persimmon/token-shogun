import { Stage } from "@/game-logic/stage/interface";
import { STAGE_LIST } from "@/game-logic/stage/list";
import { ResourceNotFoundError } from "../util/error/custom/resource-not-found-error";

/**
 * ステージ情報に関するサービス
 */
export class StageService {
  /**
   * インスタンス（Singleton用）
   */
  private static instance: StageService;

  /**
   * コンストラクタ（Kiroが生成）
   */
  private constructor() {}

  /**
   * インスタンスを取得する（Kiroが生成）
   */
  public static getInstance(): StageService {
    if (!StageService.instance) {
      StageService.instance = new StageService();
    }
    return StageService.instance;
  }

  /**
   * ステージ情報を全て取得する関数
   * @returns 全てのステージ情報
   */
  public findAll(): ReadonlyArray<Stage> {
    return STAGE_LIST;
  }

  /**
   * 指定されたIDのステージ情報を取得する関数（Kiroが生成）
   * @param id ステージ情報ID
   * @returns ステージ（見つからない場合はエラー）
   */
  public findByIdOrFail(id: string): Stage {
    const stage = STAGE_LIST.find((stage) => stage.id === id);
    if (!stage) {
      throw new ResourceNotFoundError("Stage", id);
    }
    return stage;
  }
}
