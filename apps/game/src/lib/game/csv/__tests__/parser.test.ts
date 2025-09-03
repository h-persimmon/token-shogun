import { describe, expect, it } from "vitest";
import { CSVParser } from "../parser";

describe("CSVParser", () => {
  describe("parseCSVText", () => {
    it("should parse valid CSV text", () => {
      const csvText = `waveNumber,enemyType,count,spawnInterval,spawnDelay,spawnX,spawnY
1,basic,5,2000,0,3,8
2,fast,3,1500,1000,5,10`;

      const result = CSVParser.parseCSVText(csvText);

      expect(result.isValid).toBe(true);
      expect(result.validRows).toHaveLength(2);
      expect(result.errors).toHaveLength(0);
      expect(result.totalRows).toBe(2);
      expect(result.validRowCount).toBe(2);

      expect(result.validRows[0]).toEqual({
        waveNumber: 1,
        enemyType: "basic",
        count: 5,
        spawnInterval: 2000,
        spawnDelay: 0,
        spawnX: 3,
        spawnY: 8,
      });

      expect(result.validRows[1]).toEqual({
        waveNumber: 2,
        enemyType: "fast",
        count: 3,
        spawnInterval: 1500,
        spawnDelay: 1000,
        spawnX: 5,
        spawnY: 10,
      });
    });

    it("should handle CSV with quoted fields", () => {
      const csvText = `waveNumber,enemyType,count,spawnInterval,spawnDelay,spawnX,spawnY
"1","basic","5","2000","0","3","8"
"2","fast","3","1500","1000","5","10"`;

      const result = CSVParser.parseCSVText(csvText);

      expect(result.isValid).toBe(true);
      expect(result.validRows).toHaveLength(2);
      expect(result.errors).toHaveLength(0);
    });

    it("should handle CSV with extra whitespace", () => {
      const csvText = `waveNumber , enemyType , count , spawnInterval , spawnDelay , spawnX , spawnY
 1 , basic , 5 , 2000 , 0 , 3 , 8 
 2 , fast , 3 , 1500 , 1000 , 5 , 10 `;

      const result = CSVParser.parseCSVText(csvText);

      expect(result.isValid).toBe(true);
      expect(result.validRows).toHaveLength(2);
      expect(result.errors).toHaveLength(0);

      // 空白が除去されていることを確認
      expect(result.validRows[0].enemyType).toBe("basic");
      expect(result.validRows[1].enemyType).toBe("fast");
    });

    it("should handle CSV with alternative header names", () => {
      const csvText = `wave,enemy,count,interval,delay,x,y
1,basic,5,2000,0,3,8
2,fast,3,1500,1000,5,10`;

      const result = CSVParser.parseCSVText(csvText);

      expect(result.isValid).toBe(true);
      expect(result.validRows).toHaveLength(2);
      expect(result.errors).toHaveLength(0);
    });

    it("should handle CSV with snake_case headers", () => {
      const csvText = `wave_number,enemy_type,count,spawn_interval,spawn_delay,spawn_x,spawn_y
1,basic,5,2000,0,3,8
2,fast,3,1500,1000,5,10`;

      const result = CSVParser.parseCSVText(csvText);

      expect(result.isValid).toBe(true);
      expect(result.validRows).toHaveLength(2);
      expect(result.errors).toHaveLength(0);
    });

    it("should handle missing required headers", () => {
      const csvText = `waveNumber,enemyType,count
1,basic,5
2,fast,3`;

      const result = CSVParser.parseCSVText(csvText);

      expect(result.isValid).toBe(false);
      expect(result.validRows).toHaveLength(0);
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.errors[0].type).toBe("MISSING_REQUIRED_FIELD");
    });

    it("should handle duplicate headers", () => {
      const csvText = `waveNumber,enemyType,count,count,spawnInterval,spawnDelay,spawnX,spawnY
1,basic,5,5,2000,0,3,8`;

      const result = CSVParser.parseCSVText(csvText);

      // Papa Parseは重複ヘッダーを自動的にリネームするため、
      // パースは成功するが、データ検証で失敗する可能性がある
      // この場合は警告として扱う
      expect(result.isValid).toBe(true); // Papa Parseがリネームするため成功
      expect(result.validRows).toHaveLength(1);
    });

    it("should handle empty CSV", () => {
      const csvText = "";

      const result = CSVParser.parseCSVText(csvText);

      expect(result.isValid).toBe(false);
      expect(result.validRows).toHaveLength(0);
      expect(result.totalRows).toBe(0);
    });

    it("should handle CSV with only headers", () => {
      const csvText =
        "waveNumber,enemyType,count,spawnInterval,spawnDelay,spawnX,spawnY";

      const result = CSVParser.parseCSVText(csvText);

      expect(result.isValid).toBe(true);
      expect(result.validRows).toHaveLength(0);
      expect(result.totalRows).toBe(0);
      expect(result.validRowCount).toBe(0);
    });

    it("should skip empty lines", () => {
      const csvText = `waveNumber,enemyType,count,spawnInterval,spawnDelay,spawnX,spawnY
1,basic,5,2000,0,3,8

2,fast,3,1500,1000,5,10

`;

      const result = CSVParser.parseCSVText(csvText);

      expect(result.isValid).toBe(true);
      expect(result.validRows).toHaveLength(2);
      expect(result.totalRows).toBe(2);
    });

    it("should handle invalid CSV format", () => {
      const csvText = "This is not a valid CSV format";

      const result = CSVParser.parseCSVText(csvText);

      expect(result.isValid).toBe(false);
      expect(result.validRows).toHaveLength(0);
      expect(result.errors.length).toBeGreaterThan(0);
    });
  });

  describe("generateSampleCSV", () => {
    it("should generate valid sample CSV", () => {
      const sampleCSV = CSVParser.generateSampleCSV();

      expect(typeof sampleCSV).toBe("string");
      expect(sampleCSV.length).toBeGreaterThan(0);

      // 生成されたサンプルCSVをパースして検証
      const result = CSVParser.parseCSVText(sampleCSV);

      expect(result.isValid).toBe(true);
      expect(result.validRows.length).toBeGreaterThan(0);
      expect(result.errors).toHaveLength(0);

      // サンプルデータの内容を確認
      const firstRow = result.validRows[0];
      expect(firstRow.waveNumber).toBe(1);
      expect(firstRow.enemyType).toBe("basic");
      expect(firstRow.count).toBe(5);
    });

    it("should generate CSV with multiple waves", () => {
      const sampleCSV = CSVParser.generateSampleCSV();
      const result = CSVParser.parseCSVText(sampleCSV);

      const waveNumbers = [
        ...new Set(result.validRows.map((row) => row.waveNumber)),
      ];
      expect(waveNumbers.length).toBeGreaterThan(1);
      expect(waveNumbers).toContain(1);
      expect(waveNumbers).toContain(2);
      expect(waveNumbers).toContain(3);
    });

    it("should generate CSV with different enemy types", () => {
      const sampleCSV = CSVParser.generateSampleCSV();
      const result = CSVParser.parseCSVText(sampleCSV);

      const enemyTypes = [
        ...new Set(result.validRows.map((row) => row.enemyType)),
      ];
      expect(enemyTypes.length).toBeGreaterThan(1);
      expect(enemyTypes).toContain("basic");
      expect(enemyTypes).toContain("fast");
      expect(enemyTypes).toContain("heavy");
    });
  });

  describe("generateCSVText", () => {
    it("should generate CSV text from data", () => {
      const data = [
        {
          waveNumber: "1",
          enemyType: "basic",
          count: "5",
          spawnInterval: "2000",
          spawnDelay: "0",
          spawnX: "3",
          spawnY: "8",
        },
        {
          waveNumber: "2",
          enemyType: "fast",
          count: "3",
          spawnInterval: "1500",
          spawnDelay: "1000",
          spawnX: "5",
          spawnY: "10",
        },
      ];

      const csvText = CSVParser.generateCSVText(data);

      expect(typeof csvText).toBe("string");
      expect(csvText.length).toBeGreaterThan(0);

      // ヘッダーが含まれていることを確認
      expect(csvText).toContain("waveNumber");
      expect(csvText).toContain("enemyType");
      expect(csvText).toContain("count");

      // データが含まれていることを確認
      expect(csvText).toContain("1");
      expect(csvText).toContain("basic");
      expect(csvText).toContain("2");
      expect(csvText).toContain("fast");
    });

    it("should generate parseable CSV text", () => {
      const data = [
        {
          waveNumber: "1",
          enemyType: "basic",
          count: "5",
          spawnInterval: "2000",
          spawnDelay: "0",
          spawnX: "3",
          spawnY: "8",
        },
      ];

      const csvText = CSVParser.generateCSVText(data);
      const result = CSVParser.parseCSVText(csvText);

      expect(result.isValid).toBe(true);
      expect(result.validRows).toHaveLength(1);
      expect(result.validRows[0]).toEqual({
        waveNumber: 1,
        enemyType: "basic",
        count: 5,
        spawnInterval: 2000,
        spawnDelay: 0,
        spawnX: 3,
        spawnY: 8,
      });
    });
  });

  describe("getParseConfig", () => {
    it("should return parse configuration", () => {
      const config = CSVParser.getParseConfig();

      expect(config).toBeDefined();
      expect(config.delimiter).toBe(",");
      expect(config.skipEmptyLines).toBe(true);
      expect(config.header).toBe(true);
    });
  });
});
