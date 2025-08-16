import { Repository } from "typeorm";
import { Player } from "./player.entity";
import { TypeOrmService } from "../db/typeorm-service";

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
  public async findById(id: string): Promise<Player | null> {
    return this.playerRepository.findOne({ where: { id } });
  }

  /**
   * プレイヤーを作成する（Kiroが生成）
   */
  //   public async create(stageId: string): Promise<Player> {
  //     const player = this.playerRepository.create({});
  //     return this.playerRepository.save(player);
  //   }
}
