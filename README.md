# 化劲坊 · 中式武术彩服定制

中国风武术服装定制演示站。包含竞赛彩服、表演娱乐彩服、一衣两态、量体单、配置单生成及下载。

技术栈：React 19、Vite、TypeScript、Tailwind CSS v4、Lucide。

## 本地开发

```sh
npm ci
npm run dev
```

## 构建

```sh
npm run build
```

## GitHub Pages

在仓库 Settings → Pages 中将 Source 设置为 GitHub Actions。推送 main 分支会自动构建并发布；也可在 Actions 中手动运行 Deploy to GitHub Pages。

构建采用相对资源路径，可部署到项目子目录。

## 演示范围

无后端、支付或真实订单。量体数据只保存在当前页面内存中，不上传服务器，刷新后清空。主视觉为 AI 生成的设计氛围示意图。
