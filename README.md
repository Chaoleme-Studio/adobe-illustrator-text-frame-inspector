# Text Frame Inspector

[中文](README.md) | [English](README_en.md)

Text Frame Inspector 是一个 Adobe Illustrator CEP 面板插件，用于在交付、印刷或导出前检查文档里的隐藏文本框、占位文本和异常文本对象。它会扫描当前文档中的所有文本框，标记疑似占位内容，在画板上绘制临时定位框，并支持从结果列表跳转到对应对象。

当前版本：`1.1.0`

## 这个插件是做什么的

这个插件面向 Illustrator 文件的交付前检查。很多文本框肉眼不容易看到，但仍然可能影响印刷、导出、审稿或最终交付质量。Text Frame Inspector 的目标就是把这些对象找出来，并让用户能快速定位。

默认检查项：

- 中文占位文本前缀，例如 `滚滚长江东逝水` 和 `是非成败转头空`
- 英文占位文本前缀，例如 `lorem ipsum`、`placeholder`、`dummy text`、`sample text`、`the quick brown fox`、`your text here`、`text goes here`
- 空文本框
- 极小字号文本
- 隐藏图层上的文本框
- 完全透明的文本框
- 位于当前画板外的文本框

主要功能：

- 扫描当前 Illustrator 文档中的所有文本框
- 显示可搜索的结果列表
- 高亮所有文本框位置
- 只高亮敏感字或风险文本框
- 点击列表项后定位到画板中的对应文本框
- 绘制临时定位框和十字坐标线
- 配置敏感词前缀、高亮颜色和线框粗细
- 面板界面支持中文和英文切换，默认中文

兼容性：

- 推荐环境：Adobe Illustrator 2023 及以上
- Manifest 支持：Illustrator 2020 及以上，host version `ILST [24.0,99.9]`
- 当前发布包主要面向 Windows
- 插件类型：CEP 面板

## 用户怎么用，以及基本原理

安装后重启 Illustrator，然后打开：

```text
窗口 > 扩展（旧版） > Text Frame Inspector
```

常用流程：

1. 打开一个 Illustrator 文档。
2. 点击 `扫描所有文字`。
3. 查看下方结果列表。
4. 点击列表里的某一项，插件会在画板中选中并定位到对应文本框。
5. 点击 `高亮所有文本框位置`，给所有文本框绘制临时定位框。
6. 点击 `高亮所有敏感字文本框`，只标出风险文本框。
7. 点击 `还原`，移除所有临时高亮层。

配置方式：

- 打开 `配置` Tab。
- 每行填写一个敏感词前缀。
- 调整颜色和线框粗细。
- 点击 `保存配置`。

基本原理：

- 面板界面使用 Adobe CEP，前端由 HTML、CSS 和 JavaScript 实现。
- 面板通过 `CSInterface.evalScript` 调用 Illustrator 内部脚本。
- Illustrator 侧逻辑写在 `jsx/host.jsx`，运行环境是 ExtendScript。
- 脚本读取 `app.activeDocument.textFrames`，分析每个文本框后把 JSON 结果返回给面板。
- 高亮效果画在临时图层 `__TextFrameInspector__` 上。
- `还原` 会删除这个临时图层，正常情况下不会修改原始 artwork。

## 开发与打包

项目结构：

```text
TextFrameInspector/
  CSXS/manifest.xml
  css/style.css
  js/CSInterface.js
  js/main.js
  jsx/host.jsx
  index.html
  installer/TextFrameInspector.iss
  scripts/build-release.ps1
  scripts/build-exe.ps1
  scripts/build-zxp.ps1
  .github/workflows/release.yml
```

本地开发安装路径：

```text
C:\Users\<username>\AppData\Roaming\Adobe\CEP\extensions\TextFrameInspector
```

如果未签名扩展不显示，可以开启 CEP 调试模式：

```powershell
reg add "HKCU\Software\Adobe\CSXS.9" /v PlayerDebugMode /t REG_SZ /d 1 /f
reg add "HKCU\Software\Adobe\CSXS.10" /v PlayerDebugMode /t REG_SZ /d 1 /f
reg add "HKCU\Software\Adobe\CSXS.11" /v PlayerDebugMode /t REG_SZ /d 1 /f
```

本地构建 ZIP：

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\build-release.ps1 -Version 1.1.0
```

本地构建 EXE：

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\build-exe.ps1 -Version 1.1.0
```

需要本机安装 Inno Setup Compiler，也就是 `ISCC.exe`。

本地构建 ZXP：

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\build-zxp.ps1 -Version 1.1.0
```

需要本机安装 Adobe `ZXPSignCmd`。

发布自动化：

```powershell
git tag v1.1.0
git push origin v1.1.0
```

GitHub Actions 只会在 `v*` tag 推送时触发，并生成三个产物：

- `TextFrameInspector-<version>.zip`
- `TextFrameInspector-Setup-<version>.exe`
- `TextFrameInspector-<version>.zxp`

打包策略：

- `zip` 是最简单的备用分发格式。
- `exe` 适合面向 Windows 用户直接分发。
- `zxp` 是 CEP 扩展更正式的插件包格式，适合 Adobe 生态分发流程。
