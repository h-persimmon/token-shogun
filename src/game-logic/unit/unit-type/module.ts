import { AllyUnitType, EnemyUnitType } from "./class";
import { allyUnitTypeList, enemyUnitTypeList } from "./list";

/**
 * ユニットタイプに関するモジュール（Kiroが生成）
 */
export class UnitTypeModule {
    /**
     * 味方ユニットタイプ一覧
     */
    public readonly allyUnitTypeList: AllyUnitType[];

    /**
     * 敵ユニットタイプ一覧
     */
    public readonly enemyUnitTypeList: EnemyUnitType[];

    /**
     * コンストラクタ（Kiroが生成）
     */
    public constructor() {
        this.allyUnitTypeList = allyUnitTypeList;
        this.enemyUnitTypeList = enemyUnitTypeList;
    }

    /**
     * IDで味方ユニットタイプを検索する関数（Kiroが生成）
     * @param id ユニットタイプID
     * @returns 味方ユニットタイプ（見つからない場合はnull）
     */
    public findAllyByIdOrNull(id: string): AllyUnitType | null {
        return this.allyUnitTypeList.find((allyUnitType) => allyUnitType.id === id) || null;
    }

    /**
     * IDで敵ユニットタイプを検索する関数（Kiroが生成）
     * @param id ユニットタイプID
     * @returns 敵ユニットタイプ（見つからない場合はnull）
     */
    public findEnemyByIdOrNull(id: string): EnemyUnitType | null {
        return this.enemyUnitTypeList.find((enemyUnitType) => enemyUnitType.id === id) || null;
    }
}
