export interface OrderPostResponseBody {
  metrics: { latencyMs: number };
  output: {
    message: {
      content: { text: string }[];
      role: string;
    };
  };
  stopReason: string;
  usage: {
    cacheReadInputTokenCount: number;
    cacheReadInputTokens: number;
    cacheWriteInputTokenCount: number;
    cacheWriteInputTokens: number;
    inputTokens: number;
    outputTokens: number;
    totalTokens: number;
  };
}
