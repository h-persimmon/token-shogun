import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "export",
  trailingSlash: true,
  /* config options here */

  // tiktoken_bg.wasmを読み込むためバックエンドで実行する
  serverExternalPackages: ["@anthropic-ai/tokenizer"],
};

export default nextConfig;
