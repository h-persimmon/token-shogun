import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const initPlayer = async () => {
  await prisma.player.createMany({
    data: [
      { id: "player-01", name: "Player1(Beginning)" },
      { id: "player-02", name: "Player2(Beginning)" },
      { id: "player-03", name: "Player3(Completed)" },
    ],
  });
};

const init = async () => {
  try {
    initPlayer();
    console.log("データベースの初期化が完了しました");
  } catch (error) {
    console.error("データベースの初期化に失敗しました:", error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
};

init();
