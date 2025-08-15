/**
 * TypeORMのDataSourceが初期化されていないことを表すエラー
 */
export class DataSourceNotInitializedError extends Error {
  public constructor() {
    super("DataSource is not initialized.");
  }
}
