# Java 云服务部署与维护

2026-10-20 已部署到 `47.102.153.251`，仅新增 EvoLoop-two 的入口、进程和数据库。实际结果见[部署验收记录](../verification/20261020-cloud-deployment.md)。旧工程、旧数据库与旧服务配置不作为新服务的写入目标。

## 入口与路径

| 项目 | 地址 |
| --- | --- |
| 服务入口 | `https://www.xylcmyka.bond/EvoLoop-two` |
| 健康检查 | `https://www.xylcmyka.bond/EvoLoop-two/actuator/health` |
| API 前缀 | `https://www.xylcmyka.bond/EvoLoop-two/api/v2` |
| 注册 | `POST /EvoLoop-two/api/v2/identity/accounts` |
| 登录 | `POST /EvoLoop-two/api/v2/identity/sessions/password` |
| 内部监听 | `127.0.0.1:11093`，不开放到公网 |

HTTP 沿用既有站点的 HTTPS 跳转。`/EvoLoop-two` 补齐斜杠，`/EvoLoop-two/` 再跳到健康检查。其他子路径由 Nginx 去掉 `/EvoLoop-two/` 前缀后转发，例如 `/EvoLoop-two/api/v2/identity/session` 转到 `http://127.0.0.1:11093/api/v2/identity/session`。接口使用 Bearer 会话；此入口没有网页前端。

## 配置与隔离

| 项目 | 服务器位置或设置 |
| --- | --- |
| 服务 | `evoloop-two.service`，已启用开机自启，异常退出自动重启 |
| 服务用户 | `evoloop-two`，系统账号、禁止交互登录 |
| 当前产物 | `/opt/evoloop-two/current/app.jar` |
| 发布目录 | `/opt/evoloop-two/releases/<release>/`，包含 `release.json` |
| 环境配置 | `/etc/evoloop-two/backend.env`，root 所有、权限 `0600` |
| 数据库 | `evoloop_two`，独立用户 `evoloop_two@127.0.0.1`，仅授权该库 |
| 数据结构 | Flyway `V001`、`V002`，只初始化新库，不导入旧数据 |
| Nginx 配置 | `/etc/evoloop-two/nginx-locations.conf` |
| 共享站点修改 | `/etc/nginx/sites-available/doyifu` 的 HTTPS server 中仅增加新 include |
| 部署前备份 | `/etc/evoloop-two/deployment-backups/20261020-162018/` |

可复查的服务、代理与无凭据环境模板保存在 [infra/cloud](../../infra/cloud/)。凭据不进入仓库、发布清单或验证证据；数据库密码在服务器生成，只存入 root 环境文件。该文件由服务管理器读取，不依赖 shell 自动加载 `.env`。

服务器内存约 1.6 GiB，部署前可用约 280 MiB、没有交换空间。新服务限制堆为 160 MiB、进程组内存上限为 400 MiB、连接池为 4、Tomcat 最大线程为 16；增加 `/swapfile-evoloop-two` 的 1 GiB 交换文件并登记 `/etc/fstab`。未调整旧服务堆或 MySQL 配置。交换空间与内存限制不代表负载和性能验收。

## 当前能力边界

账号注册登录、会话撤销、同步查询及新库初始化已通过公网验证。AI 供应商参数及正式用途告知正文尚未配置，因此获取告知和新增 AI/健康用途授权返回 `503 PURPOSE_NOTICE_UNAVAILABLE`；供应商未配置时模型端口不可用。没有配置合成告知或 mock 回退。

启用这些能力前，在服务器环境文件中填写经确认的 `PURPOSE_NOTICE_VERSION`、`PURPOSE_NOTICE_TEXT`、`AI_ENDPOINT`、`AI_API_KEY` 和 `AI_MODEL`，再重启新服务。实际 AI 调用和客户端授权交互需另行验证；用户授权仍通过客户端明确提交，不能通过服务器配置自动赋予。

## 日常操作

以下命令在服务器执行，只操作新服务：

```sh
systemctl status evoloop-two --no-pager
systemctl restart evoloop-two
journalctl -u evoloop-two -n 100 --no-pager
curl --fail https://www.xylcmyka.bond/EvoLoop-two/actuator/health
```

构建仍使用项目锁定的 Java 21、Maven 3.9.11 和 Spring Boot 4.0.8；新发布前在独立 `evoloop_two_test` 库执行云端真实数据库测试和同步端到端测试，检查 JAR 边界、Java 依赖锁与生成产物。服务机不执行构建和测试。JAR 上传新发布目录后核对 SHA-256，保存提交和摘要，再切换 `current` 并重启；保留旧发布目录。新 Flyway 迁移须先核对兼容性并备份新库，不自动回退数据库。

代理配置修改前备份共享站点文件；`nginx -t` 成功才 reload。失败时还原本次配置并重新检查，禁止覆盖其他期间新增的站点改动。

## 撤下本次入口

本次是新服务首次部署，没有更早的 EvoLoop-two 发布可切回。需要撤下时：

1. 从共享 HTTPS server 中仅移除 `include /etc/evoloop-two/nginx-locations.conf;`，保留其他 include；检查通过后 reload Nginx。
2. `systemctl disable --now evoloop-two`，保留新库、环境文件、发布目录和探测账号历史。
3. 不停止 MySQL、旧 `evoloop.service`，不删除数据库或清理队列。若需回收交换文件，应单独检查当前内存和交换使用后处理。

部署前的 `fstab` 与共享站点文件备份用于对比；后续维护不要直接覆盖整个备份，以免丢失新增配置。
