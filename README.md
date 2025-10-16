# 📋 ClipBox - 智能剪贴板历史管理工具

[English](#english) | [中文](#中文)

---

<div id="中文"></div>

## 🌟 项目简介

**ClipBox** 是一款基于 Tauri 框架开发的跨平台剪贴板历史管理工具，专为提升工作效率而设计。它能够自动记录您的剪贴板历史，支持文本和图片内容，提供强大的搜索、收藏和快捷键功能，让剪贴板管理变得简单高效。

### 为什么选择 ClipBox？

- 🚀 **轻量高效** - 基于 Tauri 开发，内存占用小，启动速度快
- 🎯 **智能管理** - 自动记录剪贴板历史，最多保存 100 条记录
- 🔍 **快速搜索** - 实时搜索功能，快速找到历史内容
- ⭐ **收藏功能** - 重要内容一键收藏，永不丢失
- ⌨️ **全局快捷键** - 自定义快捷键，随时随地快速调用
- 🖼️ **图片支持** - 完整支持图片复制和粘贴
- 🌈 **现代界面** - 精美的渐变色界面，支持深色模式
- 🔒 **隐私保护** - 本地存储，数据完全私密

## ✨ 核心功能

### 1. 剪贴板历史记录
- 自动监控系统剪贴板变化
- 支持文本和图片内容
- 智能去重，避免重复记录
- 最多保存 100 条历史记录
- 实时同步，即时更新

### 2. 强大的搜索功能
- 实时搜索过滤
- 支持关键词高亮
- 快速定位历史内容
- 智能匹配算法

### 3. 收藏管理
- 一键标记重要内容
- 独立收藏视图
- 收藏内容永久保存
- 快速切换查看模式

### 4. 自定义快捷键
- 全局快捷键支持
- 自定义按键组合
- 跨平台适配（macOS/Windows）
- 一键显示/隐藏窗口

### 5. 便捷操作
- 点击即可复制到剪贴板
- 支持删除单条记录
- 一键清空所有历史
- 窗口置顶功能

### 6. 图片处理
- 支持图片剪贴板监控
- Base64 图片编码支持
- 图片预览功能
- 完整的图片复制粘贴

## 🖥️ 系统要求

- **macOS**: 10.15 (Catalina) 或更高版本
- **Windows**: Windows 10/11
- **Linux**: 主流发行版（Ubuntu, Debian, Fedora 等）

## 📦 安装指南

### 方式一：下载预编译版本（推荐）

1. 访问 [Releases](https://github.com/lajidonggua/ClipBox/releases) 页面
2. 下载适合您系统的安装包：
   - macOS: `.dmg` 文件
   - Windows: `.exe` 或 `.msi` 文件
   - Linux: `.AppImage` 或 `.deb` 文件
3. 运行安装程序并按照提示完成安装

### 方式二：从源码构建

#### 前置要求

确保您的系统已安装以下软件：

- [Node.js](https://nodejs.org/) (v16 或更高版本)
- [Rust](https://www.rust-lang.org/) (最新稳定版)
- [Tauri CLI](https://tauri.app/v1/guides/getting-started/prerequisites)

#### 构建步骤

```bash
# 1. 克隆仓库
git clone https://github.com/lajidonggua/ClipBox.git
cd ClipBox

# 2. 安装依赖
npm install

# 3. 运行开发模式
npm run tauri dev

# 4. 构建生产版本
npm run tauri build
```

构建完成后，安装包将生成在 `src-tauri/target/release/bundle/` 目录下。

## 🚀 使用指南

### 基础使用

1. **启动应用**：双击运行 ClipBox
2. **复制内容**：正常使用系统复制功能（Cmd+C 或 Ctrl+C）
3. **查看历史**：ClipBox 会自动记录您的剪贴板历史
4. **粘贴内容**：点击列表中的任意项即可复制到剪贴板

### 快捷键操作

- **显示/隐藏窗口**：
  - macOS: `Command + Control + V` (默认)
  - Windows: `Ctrl + Alt + V` (默认)
  - 可在设置中自定义

### 高级功能

#### 搜索历史
1. 在顶部搜索框输入关键词
2. 列表会自动过滤匹配的内容
3. 清空搜索框恢复完整列表

#### 收藏管理
1. 点击内容项右侧的 ♡ 图标添加收藏
2. 点击"收藏"按钮查看所有收藏内容
3. 再次点击 ❤️ 图标取消收藏

#### 自定义快捷键
1. 点击工具栏的 ⌨️ 图标
2. 点击"设置快捷键"按钮
3. 按下您想要的按键组合
4. 快捷键自动保存

#### 窗口置顶
- 点击 📌 图标可将窗口置于其他窗口之上

## 🛠️ 技术栈

### 前端技术
- **框架**: Vanilla TypeScript
- **构建工具**: Vite 6.0
- **UI**: 原生 HTML/CSS（渐变色设计）
- **编译器**: TypeScript 5.6

### 后端技术
- **框架**: Tauri 2.x
- **语言**: Rust (Edition 2021)
- **核心库**:
  - `tauri-plugin-clipboard-manager` - 剪贴板管理
  - `tauri-plugin-global-shortcut` - 全局快捷键
  - `serde` - 序列化/反序列化
  - `base64` - Base64 编解码

### 开发工具
- **包管理**: npm/pnpm
- **版本控制**: Git
- **代码质量**: TypeScript 类型检查

## 📁 项目结构

```
ClipBox/
├── src/                    # 前端源码
│   ├── main.ts            # 主应用逻辑
│   ├── styles.css         # 样式文件
│   └── assets/            # 静态资源
├── src-tauri/             # Tauri 后端
│   ├── src/
│   │   ├── main.rs       # Rust 主程序
│   │   └── lib.rs        # 核心功能实现
│   ├── Cargo.toml        # Rust 依赖配置
│   ├── tauri.conf.json   # Tauri 配置
│   └── icons/            # 应用图标
├── index.html             # HTML 入口
├── package.json           # Node 依赖配置
├── vite.config.ts         # Vite 配置
└── README.md              # 项目文档
```

## 🔧 开发指南

### 环境配置

```bash
# 安装 Rust
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh

# 安装 Node.js (推荐使用 nvm)
nvm install 18
nvm use 18

# 安装项目依赖
npm install
```

### 开发命令

```bash
# 启动开发服务器（热重载）
npm run dev

# 构建前端
npm run build

# 运行 Tauri 开发模式
npm run tauri dev

# 构建应用程序
npm run tauri build

# TypeScript 类型检查
npx tsc --noEmit
```

### 代码规范

- 使用 TypeScript 严格模式
- 遵循 ESLint 代码规范
- 使用 Prettier 格式化代码
- 提交前进行代码检查

## 🤝 贡献指南

我们欢迎并感谢所有形式的贡献！

### 如何贡献

1. **Fork 本仓库**
2. **创建特性分支** (`git checkout -b feature/AmazingFeature`)
3. **提交更改** (`git commit -m 'Add some AmazingFeature'`)
4. **推送到分支** (`git push origin feature/AmazingFeature`)
5. **开启 Pull Request**

### 贡献类型

- 🐛 报告 Bug
- 💡 提出新功能建议
- 📝 改进文档
- 🔧 提交代码修复
- 🌍 添加多语言支持
- 🎨 优化界面设计

### 开发注意事项

- 保持代码简洁清晰
- 添加必要的注释
- 更新相关文档
- 确保测试通过
- 遵循现有代码风格

## 📝 更新日志

### v0.1.0 (当前版本)

#### 新功能
- ✅ 剪贴板历史自动记录
- ✅ 文本和图片内容支持
- ✅ 实时搜索功能
- ✅ 收藏管理系统
- ✅ 自定义全局快捷键
- ✅ 窗口置顶功能
- ✅ 跨平台支持（macOS/Windows/Linux）

#### 技术优化
- 🔧 基于 Tauri 2.x 框架
- 🔧 TypeScript 类型安全
- 🔧 Rust 后端高性能
- 🔧 现代化 UI 设计

## ❓ 常见问题

### 1. 应用无法启动？

**解决方案**:
- 检查系统是否满足最低要求
- 确保已安装必要的运行时依赖
- 查看日志文件获取详细错误信息

### 2. 剪贴板历史不更新？

**解决方案**:
- 检查应用是否正在运行
- 确认剪贴板监控权限已授予
- 重启应用尝试

### 3. 快捷键不生效？

**解决方案**:
- 检查快捷键是否与其他应用冲突
- 尝试设置不同的快捷键组合
- 确保应用有系统辅助权限（macOS）

### 4. 如何清除所有历史记录？

**解决方案**:
- 点击界面上的"清空历史"按钮
- 或删除本地数据文件后重启应用

### 5. 图片无法复制？

**解决方案**:
- 确认图片格式受支持（PNG, JPG 等）
- 检查系统剪贴板权限
- 更新到最新版本

## 🔐 隐私与安全

ClipBox 非常重视用户隐私：

- ✅ **本地存储** - 所有数据仅保存在本地，不上传云端
- ✅ **无网络请求** - 应用不需要网络连接即可正常工作
- ✅ **开源透明** - 源代码完全开放，可自行审查
- ✅ **数据控制** - 用户完全控制自己的数据，可随时删除

## 📄 许可证

本项目采用 [MIT License](LICENSE) 开源协议。

您可以自由地：
- ✅ 使用本软件进行商业用途
- ✅ 修改和分发本软件
- ✅ 私人使用
- ✅ 在遵守许可证的前提下自由使用

## 👥 作者与贡献者

- **作者**: [lajidonggua](https://github.com/lajidonggua)
- **贡献者**: 感谢所有为本项目做出贡献的开发者！

## 📞 联系方式

- **GitHub Issues**: [提交问题](https://github.com/lajidonggua/ClipBox/issues)
- **GitHub Discussions**: [参与讨论](https://github.com/lajidonggua/ClipBox/discussions)

## 🌟 Star 历史

如果这个项目对您有帮助，请给我们一个 ⭐️！

[![Star History Chart](https://api.star-history.com/svg?repos=lajidonggua/ClipBox&type=Date)](https://star-history.com/#lajidonggua/ClipBox&Date)

## 🙏 致谢

感谢以下优秀的开源项目：

- [Tauri](https://tauri.app/) - 跨平台桌面应用框架
- [Rust](https://www.rust-lang.org/) - 系统编程语言
- [TypeScript](https://www.typescriptlang.org/) - JavaScript 类型超集
- [Vite](https://vitejs.dev/) - 下一代前端构建工具

---

<div id="english"></div>

# 📋 ClipBox - Smart Clipboard History Manager

[English](#english) | [中文](#中文)

## 🌟 Project Overview

**ClipBox** is a cross-platform clipboard history manager built with Tauri framework, designed to boost your productivity. It automatically records your clipboard history, supports both text and images, and provides powerful search, favorites, and shortcut features to make clipboard management simple and efficient.

### Why Choose ClipBox?

- 🚀 **Lightweight & Fast** - Built with Tauri, minimal memory footprint and fast startup
- 🎯 **Smart Management** - Automatically records clipboard history, stores up to 100 entries
- 🔍 **Quick Search** - Real-time search functionality to quickly find historical content
- ⭐ **Favorites** - One-click favorites for important content, never lose it again
- ⌨️ **Global Shortcuts** - Customizable shortcuts, accessible anytime, anywhere
- 🖼️ **Image Support** - Full support for image copying and pasting
- 🌈 **Modern UI** - Beautiful gradient interface with dark mode support
- 🔒 **Privacy Protection** - Local storage, completely private data

## ✨ Core Features

### 1. Clipboard History
- Automatic system clipboard monitoring
- Support for text and image content
- Smart deduplication to avoid duplicates
- Store up to 100 historical records
- Real-time synchronization and instant updates

### 2. Powerful Search
- Real-time search filtering
- Keyword highlighting support
- Quick location of historical content
- Intelligent matching algorithm

### 3. Favorites Management
- One-click marking of important content
- Dedicated favorites view
- Permanent storage of favorite items
- Quick view mode switching

### 4. Custom Shortcuts
- Global shortcut support
- Customizable key combinations
- Cross-platform adaptation (macOS/Windows)
- One-click show/hide window

### 5. Convenient Operations
- Click to copy to clipboard
- Support for deleting individual records
- One-click clear all history
- Window always-on-top feature

### 6. Image Processing
- Clipboard image monitoring support
- Base64 image encoding support
- Image preview functionality
- Complete image copy-paste support

## 🖥️ System Requirements

- **macOS**: 10.15 (Catalina) or higher
- **Windows**: Windows 10/11
- **Linux**: Mainstream distributions (Ubuntu, Debian, Fedora, etc.)

## 📦 Installation Guide

### Method 1: Download Pre-built Version (Recommended)

1. Visit the [Releases](https://github.com/lajidonggua/ClipBox/releases) page
2. Download the installer for your system:
   - macOS: `.dmg` file
   - Windows: `.exe` or `.msi` file
   - Linux: `.AppImage` or `.deb` file
3. Run the installer and follow the prompts to complete installation

### Method 2: Build from Source

#### Prerequisites

Ensure your system has the following installed:

- [Node.js](https://nodejs.org/) (v16 or higher)
- [Rust](https://www.rust-lang.org/) (latest stable version)
- [Tauri CLI](https://tauri.app/v1/guides/getting-started/prerequisites)

#### Build Steps

```bash
# 1. Clone the repository
git clone https://github.com/lajidonggua/ClipBox.git
cd ClipBox

# 2. Install dependencies
npm install

# 3. Run in development mode
npm run tauri dev

# 4. Build production version
npm run tauri build
```

After building, the installer will be generated in the `src-tauri/target/release/bundle/` directory.

## 🚀 Usage Guide

### Basic Usage

1. **Launch the app**: Double-click to run ClipBox
2. **Copy content**: Use system copy function normally (Cmd+C or Ctrl+C)
3. **View history**: ClipBox automatically records your clipboard history
4. **Paste content**: Click any item in the list to copy to clipboard

### Keyboard Shortcuts

- **Show/Hide Window**:
  - macOS: `Command + Control + V` (default)
  - Windows: `Ctrl + Alt + V` (default)
  - Customizable in settings

### Advanced Features

#### Search History
1. Enter keywords in the top search box
2. The list automatically filters matching content
3. Clear the search box to restore the full list

#### Favorites Management
1. Click the ♡ icon on the right side of content item to add to favorites
2. Click the "Favorites" button to view all favorite content
3. Click the ❤️ icon again to unfavorite

#### Custom Shortcuts
1. Click the ⌨️ icon in the toolbar
2. Click the "Set Shortcut" button
3. Press your desired key combination
4. The shortcut is automatically saved

#### Window Always on Top
- Click the 📌 icon to keep the window above other windows

## 🛠️ Technology Stack

### Frontend Technologies
- **Framework**: Vanilla TypeScript
- **Build Tool**: Vite 6.0
- **UI**: Native HTML/CSS (Gradient Design)
- **Compiler**: TypeScript 5.6

### Backend Technologies
- **Framework**: Tauri 2.x
- **Language**: Rust (Edition 2021)
- **Core Libraries**:
  - `tauri-plugin-clipboard-manager` - Clipboard management
  - `tauri-plugin-global-shortcut` - Global shortcuts
  - `serde` - Serialization/Deserialization
  - `base64` - Base64 encoding/decoding

### Development Tools
- **Package Manager**: npm/pnpm
- **Version Control**: Git
- **Code Quality**: TypeScript type checking

## 📁 Project Structure

```
ClipBox/
├── src/                    # Frontend source code
│   ├── main.ts            # Main application logic
│   ├── styles.css         # Stylesheet
│   └── assets/            # Static assets
├── src-tauri/             # Tauri backend
│   ├── src/
│   │   ├── main.rs       # Rust main program
│   │   └── lib.rs        # Core functionality
│   ├── Cargo.toml        # Rust dependencies
│   ├── tauri.conf.json   # Tauri configuration
│   └── icons/            # Application icons
├── index.html             # HTML entry point
├── package.json           # Node dependencies
├── vite.config.ts         # Vite configuration
└── README.md              # Project documentation
```

## 🔧 Development Guide

### Environment Setup

```bash
# Install Rust
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh

# Install Node.js (recommended using nvm)
nvm install 18
nvm use 18

# Install project dependencies
npm install
```

### Development Commands

```bash
# Start development server (hot reload)
npm run dev

# Build frontend
npm run build

# Run Tauri development mode
npm run tauri dev

# Build application
npm run tauri build

# TypeScript type checking
npx tsc --noEmit
```

### Code Standards

- Use TypeScript strict mode
- Follow ESLint code standards
- Format code with Prettier
- Run code checks before committing

## 🤝 Contributing

We welcome and appreciate all forms of contributions!

### How to Contribute

1. **Fork the repository**
2. **Create a feature branch** (`git checkout -b feature/AmazingFeature`)
3. **Commit your changes** (`git commit -m 'Add some AmazingFeature'`)
4. **Push to the branch** (`git push origin feature/AmazingFeature`)
5. **Open a Pull Request**

### Types of Contributions

- 🐛 Report bugs
- 💡 Suggest new features
- 📝 Improve documentation
- 🔧 Submit code fixes
- 🌍 Add multilingual support
- 🎨 Optimize UI design

### Development Notes

- Keep code clean and clear
- Add necessary comments
- Update relevant documentation
- Ensure tests pass
- Follow existing code style

## 📝 Changelog

### v0.1.0 (Current Version)

#### New Features
- ✅ Automatic clipboard history recording
- ✅ Text and image content support
- ✅ Real-time search functionality
- ✅ Favorites management system
- ✅ Custom global shortcuts
- ✅ Window always-on-top feature
- ✅ Cross-platform support (macOS/Windows/Linux)

#### Technical Improvements
- 🔧 Built on Tauri 2.x framework
- 🔧 TypeScript type safety
- 🔧 High-performance Rust backend
- 🔧 Modern UI design

## ❓ FAQ

### 1. Application won't start?

**Solution**:
- Check if system meets minimum requirements
- Ensure necessary runtime dependencies are installed
- Check log files for detailed error information

### 2. Clipboard history not updating?

**Solution**:
- Check if the application is running
- Confirm clipboard monitoring permissions are granted
- Try restarting the application

### 3. Shortcuts not working?

**Solution**:
- Check if shortcuts conflict with other applications
- Try setting different shortcut combinations
- Ensure app has accessibility permissions (macOS)

### 4. How to clear all history?

**Solution**:
- Click the "Clear History" button in the interface
- Or delete local data files and restart the application

### 5. Can't copy images?

**Solution**:
- Confirm image format is supported (PNG, JPG, etc.)
- Check system clipboard permissions
- Update to the latest version

## 🔐 Privacy & Security

ClipBox takes user privacy very seriously:

- ✅ **Local Storage** - All data is stored locally only, not uploaded to the cloud
- ✅ **No Network Requests** - Application works normally without network connection
- ✅ **Open Source** - Source code is completely open for your own review
- ✅ **Data Control** - Users have complete control over their data and can delete it at any time

## 📄 License

This project is licensed under the [MIT License](LICENSE).

You are free to:
- ✅ Use the software for commercial purposes
- ✅ Modify and distribute the software
- ✅ Use privately
- ✅ Use freely under the terms of the license

## 👥 Authors & Contributors

- **Author**: [lajidonggua](https://github.com/lajidonggua)
- **Contributors**: Thanks to all developers who have contributed to this project!

## 📞 Contact

- **GitHub Issues**: [Submit Issues](https://github.com/lajidonggua/ClipBox/issues)
- **GitHub Discussions**: [Join Discussions](https://github.com/lajidonggua/ClipBox/discussions)

## 🌟 Star History

If this project helps you, please give us a ⭐️!

[![Star History Chart](https://api.star-history.com/svg?repos=lajidonggua/ClipBox&type=Date)](https://star-history.com/#lajidonggua/ClipBox&Date)

## 🙏 Acknowledgments

Thanks to the following excellent open source projects:

- [Tauri](https://tauri.app/) - Cross-platform desktop application framework
- [Rust](https://www.rust-lang.org/) - Systems programming language
- [TypeScript](https://www.typescriptlang.org/) - Typed superset of JavaScript
- [Vite](https://vitejs.dev/) - Next generation frontend build tool

---

## 🔍 Keywords for SEO

clipboard manager, clipboard history, clipboard tool, tauri app, rust application, typescript app, cross-platform clipboard, clipboard organizer, copy paste manager, productivity tool, 剪贴板管理, 剪贴板历史, 复制粘贴工具, 效率工具, Tauri应用, Rust应用, 跨平台应用

## 📈 Development Roadmap

- [ ] Cloud sync support
- [ ] More image format support
- [ ] Plugin system
- [ ] Theme customization
- [ ] Multiple language support
- [ ] Advanced search filters
- [ ] Export/Import functionality
- [ ] Smart categorization

---

**Made with ❤️ by the ClipBox Team**
