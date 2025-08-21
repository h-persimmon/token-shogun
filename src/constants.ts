/**
 * 陣営
 */
export const FACTION = {
  ALLY: "ally",
  ENEMY: "enemy",
} as const;

/**
 * 難易度
 */
export const DIFFICULTY = {
  EASY: "easy",
  NORMAL: "normal",
  HARD: "hard",
} as const;

/**
 * ステージ情報
 */
export const STAGE = {
  S01: {
    ID: "stage1-1",
    NAME: "ステージ1（仮名）",
  },
  S02: {
    ID: "stage1-2",
    NAME: "ステージ2（仮名）",
  },
  S03: {
    ID: "stage1-3",
    NAME: "ステージ3（仮名）",
  },
};

/**
 * ユニット
 */
export const UNIT = {
  TYPE: {
    ALLY: {
      SAMURAI: {
        ID: "samurai",
        NAME: "侍",
      },
      NINJA: {
        ID: "ninja",
        NAME: "忍者",
      },
      GUNMAN: {
        ID: "gunman",
        NAME: "銃使い",
      },
    },
    ENEMY: {
      KAPPA: {
        ID: "kappa",
        NAME: "河童",
      },
      GHOST: {
        ID: "ghost",
        NAME: "幽霊",
      },
      DRAGON: {
        ID: "dragon",
        NAME: "竜",
      },
    },
  },
} as const;

/**
 * イベント
 */
export const EVENT = {
  DO_NOTHING: {
    ID: "doNothing",
    NAME: "なにもしない",
    TAGS: [] as string[],
  },
  NORMAL_ATTACK: {
    ID: "normalAttack",
    NAME: "通常攻撃",
    TAGS: ["一般攻撃", "アタック"],
  },
  FIRE_BREATH: {
    ID: "fireBreath",
    NAME: "火吹き",
    TAGS: ["火炎放射", "ファイア"],
  },
} as const;

/**
 * 環境変数
 */
export const ENV = {
  BEDROCK_API_URL: {
    DEFAULT:
      "https://bedrock-runtime.us-east-1.amazonaws.com/model/us.anthropic.claude-3-5-haiku-20241022-v1:0/",
  },
} as const;
