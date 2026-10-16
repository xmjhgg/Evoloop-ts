# 旧业务同步结构基线

采集自旧工程 `backend/src/main/resources/sync-schema.json`；版本 `rows-v1-c37f47b5a4dc12a2`，文件 SHA-256 `cb8ad65a362428e2b8911bc621d59fc884e69788b79904c932ff802ccc2f7e5f`。实际读取 95 张表；这是待迁移范围，不是新工程已经生成或应用的结构。

按领域查看：[profile](profile.md)、[planning](planning.md)、[execution](execution.md)、[review](review.md)。保留字段名、旧物理类型、可空性、主键、唯一键、同域引用。新本地表物理类型、索引和迁移 SQL 尚未生成；不能把旧 MySQL DDL 直接用于 SQLCipher、文件日志或 IndexedDB。

DECIMAL/BIGINT/序号跨语言用规范字符串；日期与 UTC 时间分开。精度、单位、引用闭包和业务不变量由客户端导入器再次校验。账号/会话/供应商内部状态不属于这 95 张本地业务表。
