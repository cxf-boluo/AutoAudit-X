---
name: Mobile Agent Operations (GUI & Unpacking)
description: "与Android设备交互的核心技能。必须用于涉及以下任何任务：1. 手机上的可视化GUI自动化（点击、读取屏幕）。2. Android应用安全审计。3. 应用脱壳（DEX Dump）。4. 通过ADB提取APK/DEX文件。5. 重建、重新打包或修复Dump出的DEX文件，生成修复后的APK。"
---

# 移动代理操作技能 (Mobile Agent Operations Skill)

这项技能使代理能够通过GUI自动化与Android设备进行交互，并执行核心安全审计任务（如应用脱壳）。它基于Mobile Agent (v3.5)架构。

## 1. GUI 操作 (GUI-Owl 1.5)

你可以使用GUI-Owl模型通过ADB执行UI自动化操作。

**前提条件：** 
- 确保已通过ADB连接Android设备 (`adb devices`)。

**执行：**
导航到 mobile use 模块并执行运行脚本：
```bash
cd .agent/skills/mobile_agent_operations/MobileAgent/Mobile-Agent-v3.5/mobile_use
python run_gui_owl_1_5_for_mobile.py \
    --adb_path "adb" \
    --api_key "sk-zeekr-special-555" \
    --base_url "https://aigeely.boluo-go.uk/v1" \
    --model "qwen3-vl-plus" \
    --instruction "<YOUR_INSTRUCTION>" \
    --add_info "<ADDITIONAL_INFORMATION>"
```
*根据你的需求替换 `<YOUR_INSTRUCTION>` (你的指令) 和 `<ADDITIONAL_INFORMATION>` (附加信息)（例如，“打开吉利App”）。*

## 2. 应用脱壳和重建SOP (标准操作程序)

对于需要提取和重建脱壳APK的任务，请遵循此严格的标准操作程序(SOP)。

### 权限提升
如果需要访问如 `/data/data` 这样受限的目录，请获取Root权限：
- `adb root`
- 或者在 `adb shell` 内部使用 `su` 或 `pb` 等提权命令。

### 5步脱壳流程

**步骤 1：环境探测**
检查脱壳出的DEX文件是否已存在：
```bash
adb shell ls /data/data/<package_name>/fkpt/dex/
```

**步骤 2：触发脱壳 (如果文件不存在)**
启用脱壳Dump属性并冷启动目标应用：
```bash
adb shell setprop persist.fkpt.dump 1
# 然后在手机上启动该应用以触发脱壳
```

**步骤 3：文件提取**
将Dump出的DEX文件和原始的Base APK拉取到本地工作区：
```bash
# 提取DEX文件
adb pull /data/data/<package_name>/fkpt/dex/ ./workspace/<package_name>/unpack/

# 查找并提取原始APK
adb shell pm path <package_name>
# (输出示例：package:/data/app/~~.../base.apk)
adb pull <path_from_above> ./workspace/<package_name>/restore/original.apk
```

**步骤 4：自动化重建**
通过将提取的DEX文件注入到原始APK中来重建APK：
```bash
# 注意：确保路径与你的工作区对齐（例如，`.agent/skills/mobile_agent_operations/MobileAgent/...`）
python .agent/skills/mobile_agent_operations/MobileAgent/scripts/rebuild_apk.py <package_name>
```

**步骤 5：清理 (关键，必须执行)**
禁用Dump属性以防止设备性能出现问题。**不要跳过此步骤。**
```bash
adb shell setprop persist.fkpt.dump 0
```

**最终验证：**
验证是否在 `workspace/<package_name>/restore/fixed.apk` 成功生成了重建的APK，并检查文件大小是否合理。
