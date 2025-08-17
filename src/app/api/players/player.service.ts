import { Repository } from "typeorm";
import { Player } from "./player.entity";
import { TypeOrmService } from "../util/db/typeorm.service";

/**
 * ゲームに関するサービス（Kiroが生成）
 */
export class PlayerService {
  /**
   * インスタンス（Singleton用）
   */
  private static instance: PlayerService;

  /**
   * プレイヤーに関するリポジトリ
   */
  private readonly playerRepository: Repository<Player>;

  /**
   * コンストラクタ（Kiroが生成）
   */
  private constructor() {
    this.playerRepository = TypeOrmService.getRepository(Player);
  }

  /**
   * インスタンスを取得する（Kiroが生成）
   */
  public static getInstance(): PlayerService {
    if (!PlayerService.instance) {
      PlayerService.instance = new PlayerService();
    }
    return PlayerService.instance;
  }

  /**
   * 全てのプレイヤーを取得する（Kiroが生成）
   */
  public async findAll(): Promise<Player[]> {
    return this.playerRepository.find();
  }

  /**
   * IDでプレイヤーを取得する（Kiroが生成）
   */
  public async findByIdOrNull(id: string): Promise<Player | null> {
    return this.playerRepository.findOne({ where: { id } });
  }

  /**
   * IDでプレイヤーを取得し、なければ例外を投げる
   */
  public async findByIdOrFail(id: string): Promise<Player> {
    return this.playerRepository.findOneOrFail({ where: { id } });
  }

  /**
   * プレイヤーを作成する（Kiroが生成）
   */
  public async create(id: string, name: string): Promise<Player> {
    const player = this.playerRepository.create({ id, name });
    return this.playerRepository.save(player);
  }
}
