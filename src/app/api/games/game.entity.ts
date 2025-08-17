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
  @Column({
    name: "stage_id",
  })
  stageId!: string;

  /**
   * 正常に終了したか
   */
  @Column({
    name: "is_finished",
  })
  isFinished!: boolean;

  /**
   * クリアされたか
   */
  @Column({
    name: "is_completed",
  })
  isCompleted!: boolean;

  /**
   * 消費したトークン数
   */
  @Column({
    name: "consumed_token",
  })
  consumedToken!: number;

  /**
   * プレイしたプレイヤー（Kiroが生成）
   */
  @ManyToOne(() => Player, (player) => player.games)
  @JoinColumn({ name: "player_id" })
  player!: Player;

  /**
   * コンストラクタ
   * @param partial 部分型
   */
  constructor(partial?: Partial<Game>) {
    Object.assign(this, partial);
  }
}
