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
  id?: string;

  /**
   * ステージID
   */
  @Column()
  stageId?: string;
}
