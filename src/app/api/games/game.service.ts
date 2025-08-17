import { Repository } from "typeorm";
import { Game } from "./game.entity";
import { TypeOrmService } from "../util/db/typeorm.service";
import { Player } from "../players/player.entity";

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
    return this.gameRepository.find({ relations: { player: true } });
  }

  /**
   * 指定されたプレイヤーがプレイしたゲームを取得する
   * @param playerId プレイヤーID
   */
  public async findByPlayerId(playerId: string): Promise<Game[]> {
    return this.gameRepository.find({
      where: {
        player: new Player({ id: playerId }),
      },
    });
  }

  /**
   * 指定されたプレイヤーがクリアしたゲームを取得する
   * @param playerId プレイヤーID
   */
  public async findCompletedGamesByPlayerId(playerId: string): Promise<Game[]> {
    return this.gameRepository.find({
      where: {
        player: new Player({ id: playerId }),
        isCompleted: true,
      },
    });
  }

  /**
   * IDでゲームを取得する（Kiroが生成）
   */
  public async findByIdOrNull(id: string): Promise<Game | null> {
    return this.gameRepository.findOne({
      where: { id },
      relations: { player: true },
    });
  }

  /**
   * IDでゲームを取得し、なければ例外を投げる
   */
  public async findByIdOrFail(id: string): Promise<Game> {
    return this.gameRepository.findOneOrFail({
      where: { id },
      relations: { player: true },
    });
  }

  /**
   * ゲームを作成する（Kiroが生成）
   */
  public async create(stageId: string, playerId: string): Promise<Game> {
    const game = this.gameRepository.create({
      stageId,
      isFinished: false,
      isCompleted: false,
      consumedToken: -1,
      player: new Player({ id: playerId }),
    });
    return this.gameRepository.save(game);
  }

  /**
   * ゲームの終了処理
   * @param gameId ゲームID
   * @param isCompleted クリアしたかどうか
   * @param consumedToken 消費したトークン数
   */
  public async finish(
    gameId: string,
    isCompleted: boolean,
    consumedToken: number,
  ): Promise<void> {
    if (consumedToken < 0) {
      throw new Error("消費トークン数が不正です");
    }
    await this.update(gameId, {
      isFinished: true,
      isCompleted,
      consumedToken,
    });
  }

  /**
   * ゲームを終了する（API用）（Kiroが生成）
   */
  public async finishGame(
    gameId: string,
    isCompleted: boolean,
    consumedToken: number,
  ): Promise<void> {
    return this.finish(gameId, isCompleted, consumedToken);
  }

  /**
   * ゲームを更新する（Kiroが生成）
   */
  private async update(
    id: string,
    gameData: Partial<Game>,
  ): Promise<Game | null> {
    await this.gameRepository.update(id, gameData);
    return this.findByIdOrNull(id);
  }

  /**
   * ゲームを削除する（Kiroが生成）
   */
  public async delete(id: string): Promise<void> {
    this.gameRepository.delete(id);
  }
}
