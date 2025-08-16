import { Column, Entity, PrimaryGeneratedColumn } from "typeorm";

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
   * コンストラクタ
   * @param partial 部分型
   */
  constructor(partial?: Partial<Game>) {
    Object.assign(this, partial);
  }
}
