import { Column, Entity, PrimaryColumn } from "typeorm";

/**
 * DBに保存するプレイヤー情報のエンティティ
 */
@Entity()
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
   * コンストラクタ
   * @param partial 部分型
   */
  constructor(partial?: Partial<Player>) {
    Object.assign(this, partial);
  }
}
