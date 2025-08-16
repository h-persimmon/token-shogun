import {
  Column,
  Entity,
  PrimaryGeneratedColumn,
  ManyToOne,
  JoinColumn,
} from "typeorm";
import { Player } from "../players/player.entity";

/**
 * DBに保存するゲームごとの情報のエンティティ
 */
@Entity()
export class Game {
  /**
   * ID
   */
  @PrimaryGeneratedColumn()
  id!: string;

  /**
   * ステージID
   */
  @Column()
  stageId!: string;

  /**
   * クリアされたか
   */
  @Column()
  isCleared!: boolean;

  /**
   * プレイしたプレイヤー（Kiroが生成）
   */
  @ManyToOne(() => Player, (player) => player.games)
  player!: Player;

  /**
   * コンストラクタ
   * @param partial 部分型
   */
  constructor(partial?: Partial<Game>) {
    Object.assign(this, partial);
  }
}
