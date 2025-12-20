# Frontend (React)

这是项目的前端骨架（基于 Vite + React）。

## 本地运行

1. 安装依赖

```bash
npm install
```

2. 启动开发服务器

```bash
npm run dev
```

## 常见权限问题

如果遇到 `EPERM` 写入缓存的错误：

- 以管理员权限运行 PowerShell 或命令行，再执行 `npm install`；
- 或者临时切换 npm 缓存目录：

```powershell
npm config set cache "C:\Users\<your-user>\npm-cache" --global
```

- 也可以清空缓存并重试：

```powershell
npm cache clean --force
```

如果企业杀毒或防护软件阻止了写入，请尝试短时禁用或把 Node 缓存目录加入白名单。