import { Stage } from "./interface";
import { stageList } from "./list";

/**
 * ステージに関するモジュール（Kiroが生成）
 */
export class StageModule {
    /**
     * ステージ一覧
     */
    public readonly stageList: Stage[];

    /**
     * コンストラクタ（Kiroが生成）
     */
    public constructor() {
        this.stageList = stageList;
    }

    /**
     * IDでステージを検索する関数（Kiroが生成）
     * @param id ステージID
     * @returns ステージ（見つからない場合はnull）
     */
    public findByIdOrNull(id: number): Stage | null {
        return this.stageList.find((stage) => stage.id === id) || null;
    }
}
