# 顾客扫码即看 · 个人 Gitee 部署

用 **个人 Gitee 账号**（与公司 Git 无关），把构建好的 `dist` 传到网上，顾客扫码即看。

---

## 1. 构建

```bash
cd nail-beauty
npm run build
```

构建结果在 **`nail-beauty/dist/`** 文件夹。

---

## 2. 个人 Gitee 建仓库

1. 登录 [gitee.com](https://gitee.com)（个人账号，如 15235952769）
2. 新建仓库 **huahua-nail**，公开，**不要**勾选「使用 Readme 初始化」

---

## 3. 网页上传 dist（不用额外文件夹）

1. 打开仓库 → **代码** → **上传文件**（或「+」→ 上传文件）
2. 把 **`dist` 文件夹里的全部内容**拖进去（`index.html`、`assets/`、`caihui/` 等）  
   ⚠️ 是 dist **里面的文件**，不是把整个 dist 文件夹上传成一层目录
3. 提交到 master

以后更新：重新 `npm run build`，再在 Gitee 网页上删除旧文件、上传新的 dist 内容（或用 Git 客户端推送到个人仓库，任选其一）。

---

## 4. 开启 Gitee Pages

仓库 → **服务** → **Gitee Pages** → 启动  

记下网址，例如：`https://15235952769.gitee.io/huahua-nail/`

---

## 5. 生成顾客二维码

1. 复制 `deploy.config.example.json` → `deploy.config.json`
2. 填写 Pages 地址：

```json
{
  "publicUrl": "https://15235952769.gitee.io/huahua-nail/",
  "giteeRepoUrl": "https://gitee.com/15235952769/huahua-nail"
}
```

3. 执行：

```bash
npm run build
npm run gen-qr
```

4. 使用 **`release/顾客扫码.png`** 打印或发微信 → 顾客扫码即看

---

## 店内临时（可选）

`npm run package` → **打开网站.bat**，顾客同 WiFi 扫屏幕码（不能在家扫）。
