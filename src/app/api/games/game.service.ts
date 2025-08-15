import { Repository } from "typeorm";
import { Game } from "./game.entity";
import { TypeOrmService } from "../db/typeorm-service";

/**
 * ゲームに関するサービス（Kiroが生成）
 */
export class GameService {
  /**
   * インスタンス（Singleton用）
   */
  private static instance: GameService;

  /**
   * ゲームに関するリポジトリ
   */
  private readonly gameRepository: Repository<Game>;

  /**
   * コンストラクタ（Kiroが生成）
   */
  private constructor() {
    this.gameRepository = TypeOrmService.getRepository(Game);
  }

  /**
   * インスタンスを取得する（Kiroが生成）
   */
  public static getInstance(): GameService {
    if (!GameService.instance) {
      GameService.instance = new GameService();
    }
    return GameService.instance;
  }

  /**
   * 全てのゲームを取得する（Kiroが生成）
   */
  public async findAll(): Promise<Game[]> {
    return this.gameRepository.find();
  }

  /**
   * IDでゲームを取得する（Kiroが生成）
   */
  public async findById(id: string): Promise<Game | null> {
    return this.gameRepository.findOne({ where: { id } });
  }

  /**
   * ゲームを作成する（Kiroが生成）
   */
  public async create(stageId: string): Promise<Game> {
    const game = this.gameRepository.create({ stageId });
    return this.gameRepository.save(game);
  }

  /**
   * ゲームを更新する（Kiroが生成）
   */
  public async update(
    id: string,
    gameData: Partial<Game>,
  ): Promise<Game | null> {
    await this.gameRepository.update(id, gameData);
    return this.findById(id);
  }

  /**
   * ゲームを削除する（Kiroが生成）
   */
  public async delete(id: string): Promise<void> {
    this.gameRepository.delete(id);
  }
}
