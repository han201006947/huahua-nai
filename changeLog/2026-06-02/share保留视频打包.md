# share 打包保留视频

## 改动背景

用户要求 `npm run share` 上传给顾客时**不要去掉视频**，线上作品页需能正常播放款式视频。

## 涉及文件

- `scripts/share-online.ps1`：去掉 robocopy 对 `.mp4/.mov/.webm` 的排除，完整复制 `dist`

## 行为变化

- `npm run share` 生成的 `release/website-upload.zip` **包含全部视频**
- 控制台提示由「videos removed」改为「with videos」
- 若 zip 过大导致免费托管上传失败，仍可用 `npm run package` 店内 WiFi 展示

## 验证方式

```bash
npm run share
```

检查 zip 内是否存在 `maoyan/`、`caihui/` 等目录下的 `.mp4` 文件。

## Git 提交

- **是否已提交**：否
- **本地 commit**：—
- **提交说明**：—
