import {
  Column,
  Entity,
  PrimaryColumn,
  OneToMany,
  type Relation,
} from "typeorm";
import { Game } from "../games/game.entity";

/**
 * DBに保存するプレイヤー情報のエンティティ
 */
@Entity("player")
export class Player {
  /**
   * ID
   */
  @PrimaryColumn()
  id!: string;

  /**
   * 名前
   */
  @Column()
  name!: string;

  /**
   * プレイしたゲーム一覧（Kiroが生成）
   */
  @OneToMany(() => Game, (game) => game.player)
  games!: Relation<Game[]>;

  /**
   * コンストラクタ
   * @param partial 部分型
   */
  constructor(partial?: Partial<Player>) {
    Object.assign(this, partial);
  }
}
