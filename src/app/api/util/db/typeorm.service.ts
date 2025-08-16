import "reflect-metadata";
import { DataSource, EntityTarget, ObjectLiteral, Repository } from "typeorm";
import { Game } from "../../games/game.entity";
import { DataSourceNotInitializedError } from "../error/custom/data-source-not-initialized-error";
import { Player } from "../../players/player.entity";

/**
 * TypeORMサービス（Kiroが生成）
 */
export class TypeOrmService {
  /**
   * TypeORMのdataSource
   */
  private static dataSource: DataSource | null;

  /**
   * DataSourceを初期化する関数（Kiroが生成）
   * @returns メッセージ
   */
  public static async initialize(): Promise<void> {
    if (this.dataSource && this.dataSource.isInitialized) {
      return;
    }

    this.dataSource = new DataSource({
      type: "sqlite",
      database: process.env.DATABASE_PATH || "sqlite3/database.db",
      synchronize: process.env.NODE_ENV !== "production",
      logging: process.env.NODE_ENV === "development",
      entities: [Game, Player],
    });

    await this.dataSource.initialize();
  }

  /**
   * エンティティからそのリポジトリを作成する関数
   * @param target エンティティ
   * @returns リポジトリ
   */
  public static getRepository<Entity extends ObjectLiteral>(
    target: EntityTarget<Entity>,
  ): Repository<Entity> {
    return TypeOrmService.getDataSource().getRepository(target);
  }

  /**
   * DataSourceを取得する関数（Kiroが生成）
   */
  private static getDataSource(): DataSource {
    if (
      !TypeOrmService.dataSource ||
      !TypeOrmService.dataSource.isInitialized
    ) {
      throw new DataSourceNotInitializedError();
    }
    return TypeOrmService.dataSource;
  }
}
