import { PlayerService } from "./app/api/players/player.service";
import { TypeOrmService } from "./app/api/util/db/typeorm.service";

/**
 * プレイヤーを初期化する
 */
const initializePlayer = async () => {
  const playerService = PlayerService.getInstance();
  await playerService.create("player-01", "Player1(Beginning)");
  await playerService.create("player-02", "Player2(Beginning)");
  await playerService.create("player-03", "Player3(Completed)");
};

/**
 * データベースを初期化する関数（Kiroが生成）
 */
const initializeDatabase = async () => {
  try {
    await TypeOrmService.initialize();
    await initializePlayer();
    console.log("データベースの初期化が完了しました");
  } catch (error) {
    console.error("データベースの初期化に失敗しました:", error);
    process.exit(1);
  }
};

initializeDatabase();
