import { listen } from '@tauri-apps/api/event';
import { invoke } from '@tauri-apps/api/core';
import { register, unregister } from '@tauri-apps/plugin-global-shortcut';
import { platform } from "@tauri-apps/plugin-os";

interface ClipboardItem {
  id: string;
  content: string;
  timestamp: number;
  item_type: 'text' | 'image';
  image_path?: string;
  is_favorite: boolean;
}

class ClipBox {
  private clipboardHistory: ClipboardItem[] = [];
  private maxHistorySize = 100;
  private searchInput: HTMLInputElement;
  private clipboardList: HTMLElement;
  private clearAllBtn: HTMLButtonElement;
  private toggleTopBtn: HTMLButtonElement;
  private shortcutBtn: HTMLButtonElement;
  private shortcutModal: HTMLElement;
  private shortcutDisplay: HTMLElement;
  private shortcutKeyInput: HTMLInputElement;
  private setShortcutBtn: HTMLButtonElement;
  private resetShortcutBtn: HTMLButtonElement;
  private closeShortcutModal: HTMLButtonElement;
  private shortcutKey: string;
  private isListeningForShortcut: boolean = false;
  private showAllBtn: HTMLButtonElement;
  private showFavoritesBtn: HTMLButtonElement;
  private currentFilter: 'all' | 'favorites' = 'all';

  constructor() {
    this.searchInput = document.getElementById('search-input') as HTMLInputElement;
    this.clipboardList = document.getElementById('clipboard-list') as HTMLElement;
    this.clearAllBtn = document.getElementById('clear-all-btn') as HTMLButtonElement;
    this.toggleTopBtn = document.getElementById('toggle-top-btn') as HTMLButtonElement;
    this.shortcutBtn = document.getElementById('shortcut-btn') as HTMLButtonElement;
    this.shortcutModal = document.getElementById('shortcut-modal') as HTMLElement;
    this.shortcutDisplay = document.getElementById('shortcut-display') as HTMLElement;
    this.shortcutKeyInput = document.getElementById('shortcut-key') as HTMLInputElement;
    this.setShortcutBtn = document.getElementById('set-shortcut-btn') as HTMLButtonElement;
    this.resetShortcutBtn = document.getElementById('reset-shortcut-btn') as HTMLButtonElement;
    this.closeShortcutModal = document.getElementById('close-shortcut-modal') as HTMLButtonElement;
    this.showAllBtn = document.getElementById('show-all-btn') as HTMLButtonElement;
    this.showFavoritesBtn = document.getElementById('show-favorites-btn') as HTMLButtonElement;
    
    // 初始化shortcutKey属性
    this.shortcutKey = '';
    
    this.init();
  }

  private async init() {
    console.log('初始化 ClipBox...');
    
    // 加载历史数据
    await this.loadHistory();
    console.log('历史数据加载完成:', this.clipboardHistory.length);
    
    // 加载保存的快捷键或设置默认值
    this.shortcutKey = await this.loadShortcutKey();
    this.shortcutKeyInput.value = this.shortcutKey;
    this.shortcutDisplay.textContent = this.formatShortcutDisplay(this.shortcutKey);
    
    // 设置事件监听
    this.setupEventListeners();
    console.log('事件监听器设置完成');
    
    // 开始监听剪贴板变化
    await this.startClipboardMonitoring();
    console.log('剪贴板监听启动完成');
    
    // 渲染界面
    this.render();
    console.log('界面渲染完成');
  }

  private setupEventListeners() {
    // 搜索功能
    this.searchInput.addEventListener('input', (e) => {
      const query = (e.target as HTMLInputElement).value.toLowerCase();
      this.filterHistory(query);
    });

    // 清空历史
    this.clearAllBtn.addEventListener('click', () => {
      this.clearAllHistory();
    });

    // 切换置顶
    this.toggleTopBtn.addEventListener('click', async () => {
      try {
        await invoke('toggle_always_on_top');
        this.toggleTopBtn.classList.toggle('active');
      } catch (error) {
        console.error('切换置顶失败:', error);
      }
    });



    // 快捷键设置
    this.shortcutBtn.addEventListener('click', () => {
      this.showShortcutModal();
    });

    this.closeShortcutModal.addEventListener('click', () => {
      this.hideShortcutModal();
    });

    this.setShortcutBtn.addEventListener('click', () => {
      this.startListeningForShortcut();
    });

    this.resetShortcutBtn.addEventListener('click', async () => {
      await this.resetShortcutToDefault();
    });

    // 点击模态框外部关闭
    this.shortcutModal.addEventListener('click', (e) => {
      if (e.target === this.shortcutModal) {
        this.hideShortcutModal();
      }
    });

    // 收藏筛选按钮
    this.showAllBtn.addEventListener('click', () => {
      this.setFilter('all');
    });

    this.showFavoritesBtn.addEventListener('click', () => {
      this.setFilter('favorites');
    });

    // 使用全局快捷键代替页面事件监听
    // 全局快捷键在loadShortcutKey和saveShortcutKey方法中注册

    // 监听剪贴板变化事件
    listen('clipboard-changed', (event) => {
      console.log('收到剪贴板变化事件:', event.payload);
      const content = event.payload as string;
      this.addToHistory(content);
    });
  }

  private async startClipboardMonitoring() {
    try {
      console.log('开始启动剪贴板监听...');
      // 启动 Rust 后端的剪贴板监听
      await invoke('start_clipboard_monitor');
      console.log('剪贴板监听启动成功');
    } catch (error) {
      console.error('启动剪贴板监听失败:', error);
    }
  }

  private async loadHistory() {
    try {
      console.log('开始加载历史数据...');
      const history = await invoke('get_clipboard_history') as ClipboardItem[];
      this.clipboardHistory = history || [];
      console.log('历史数据加载成功:', this.clipboardHistory.length);
    } catch (error) {
      console.error('加载历史数据失败:', error);
      this.clipboardHistory = [];
    }
  }

  private async saveHistory() {
    try {
      await invoke('save_clipboard_history', { history: this.clipboardHistory });
    } catch (error) {
      console.error('保存历史数据失败:', error);
    }
  }

  private addToHistory(content: string) {
    console.log('添加剪贴板内容到历史:', content);
    
    if (!content || content.trim() === '') {
      console.log('内容为空，跳过');
      return;
    }
    
    // 增强的重复检查逻辑
    // 检查是否与最后几项相同
    const recentItems = this.clipboardHistory;
    for (const item of recentItems) {
      // 对于图片内容，我们只比较内容本身
      if (this.isBase64Image(content) && this.isBase64Image(item.content)) {
        // 对于base64图片，我们只比较前200个字符，避免过长的比较
        const newBase64Start = content.substring(0, 200);
        const existingBase64Start = item.content.substring(0, 200);
        if (newBase64Start === existingBase64Start) {
          console.log('图片内容与最近项相同，跳过');
          return;
        }
      } else if (item.content === content) {
        console.log('内容与最近项相同，跳过');
        return;
      }
    }

    const isImage = this.isBase64Image(content);
    const newItem: ClipboardItem = {
      id: Date.now().toString(),
      content: content.trim(),
      timestamp: Date.now(),
      item_type: isImage ? 'image' : 'text',
      image_path: isImage ? content : undefined,
      is_favorite: false
    };

    // 添加到开头
    this.clipboardHistory.unshift(newItem);
    console.log('添加到历史，当前数量:', this.clipboardHistory.length);

    // 限制历史记录数量
    if (this.clipboardHistory.length > this.maxHistorySize) {
      this.clipboardHistory = this.clipboardHistory.slice(0, this.maxHistorySize);
    }

    // 保存并渲染
    this.saveHistory();
    this.render();
  }

  private isBase64Image(content: string): boolean {
    // 检查是否是data:image/base64格式
    return content.startsWith('data:image/') && content.includes('base64,');
  }

  private async copyToClipboard(content: string, imagePath?: string) {
    console.log('复制到剪贴板:', content, imagePath);
    try {
      // 如果是base64图片
      if (this.isBase64Image(content)) {
        // 直接写入剪贴板
        await invoke('write_to_clipboard', { content });
      } else if (imagePath) {
        await invoke('copy_image_to_clipboard', { imagePath });
      } else {
        await invoke('write_to_clipboard', { content });
      }
    } catch (error) {
      console.error('复制到剪贴板失败:', error);
    }
  }

  private async copyImageToClipboard(imagePath: string) {
    console.log('复制图片到剪贴板:', imagePath);
    try {
      if (imagePath && imagePath !== 'undefined' && imagePath !== '') {
        // 添加更详细的日志，检查文件是否存在
        const isBase64 = imagePath.startsWith('data:image/');
        console.log('图片路径类型:', isBase64 ? 'Base64字符串' : '文件路径');
        
        // 根据类型选择正确的命令
        if (isBase64) {
          console.log('调用copy_base64_image_to_clipboard命令处理Base64图片...');
          await invoke('copy_base64_image_to_clipboard', { base64Content: imagePath });
        } else {
          console.log('调用copy_image_to_clipboard命令处理文件图片...');
          await invoke('copy_image_to_clipboard', { imagePath });
        }
        console.log('图片复制成功');
      } else {
        console.log('无效的图片路径');
      }
    } catch (error) {
      console.error('复制图片到剪贴板失败:', error);
      // 输出更详细的错误信息
      console.error('错误详情:', error instanceof Error ? error.message : String(error));
    }
  }

  private async copyBase64ImageToClipboard(base64Content: string) {
    console.log('复制base64图片到剪贴板');
    try {
      if (base64Content && base64Content.startsWith('data:image/')) {
        console.log('base64图片内容格式正确，开始复制...');
        await invoke('copy_base64_image_to_clipboard', { base64Content });
        console.log('base64图片复制成功');
      } else {
        console.log('无效的base64图片内容');
      }
    } catch (error) {
      console.error('复制base64图片到剪贴板失败:', error);
      console.error('错误详情:', error instanceof Error ? error.message : String(error));
    }
  }


  private async deleteItem(id: string) {
    this.clipboardHistory = this.clipboardHistory.filter(item => item.id !== id);
    await this.saveHistory();
    this.render();
  }

  private async clearAllHistory() {
    console.log('clearAllHistory方法被调用');
    try {
      // 首先尝试使用浏览器原生confirm
      let confirmed = confirm('确定要清空所有剪贴板历史吗？');
      console.log('原生confirm结果:', confirmed);
      
      // 如果原生confirm被阻止或没有显示（在某些环境中可能不支持）
      // 直接使用自定义模态框来确保用户能看到确认提示
      if (typeof confirmed === 'undefined' || !confirmed) {
        console.log('使用自定义模态框进行确认');
        confirmed = await this.showCustomConfirm('确定要清空所有剪贴板历史吗？');
        console.log('自定义模态框结果:', confirmed);
      }
      
      if (confirmed) {
        console.log('清空前历史记录数量:', this.clipboardHistory.length);
        this.clipboardHistory = [];
        console.log('清空后历史记录数量:', this.clipboardHistory.length);
        
        try {
          await this.saveHistory();
          console.log('历史记录保存成功');
        } catch (saveError) {
          console.error('保存历史记录失败:', saveError);
        }
        
        try {
          this.render();
          console.log('界面渲染完成');
        } catch (renderError) {
          console.error('界面渲染失败:', renderError);
        }
      }
    } catch (error) {
      console.error('清空历史功能执行出错:', error);
    }
  }

  // 自定义确认模态框
  private showCustomConfirm(message: string): Promise<boolean> {
    return new Promise((resolve) => {
      // 创建模态框元素
      const modal = document.createElement('div');
      modal.className = 'confirm-modal';
      modal.innerHTML = `
        <div class="confirm-content">
          <h3>确认操作</h3>
          <p>${message}</p>
          <div class="confirm-actions">
            <button id="confirm-yes" class="btn-primary">确定</button>
            <button id="confirm-no" class="btn-secondary">取消</button>
          </div>
        </div>
      `;
      
      // 添加样式
      modal.style.position = 'fixed';
      modal.style.top = '0';
      modal.style.left = '0';
      modal.style.width = '100%';
      modal.style.height = '100%';
      modal.style.display = 'flex';
      modal.style.alignItems = 'center';
      modal.style.justifyContent = 'center';
      modal.style.backgroundColor = 'rgba(0, 0, 0, 0.5)';
      modal.style.zIndex = '1000';
      
      const content = modal.querySelector('.confirm-content') as HTMLElement;
      if (content) {
        content.style.backgroundColor = 'white';
        content.style.padding = '20px';
        content.style.borderRadius = '8px';
        content.style.boxShadow = '0 2px 10px rgba(0, 0, 0, 0.2)';
        content.style.width = '300px';
        content.style.textAlign = 'center';
      }
      
      const actions = modal.querySelector('.confirm-actions') as HTMLElement;
      if (actions) {
        actions.style.marginTop = '20px';
        actions.style.display = 'flex';
        actions.style.gap = '10px';
        actions.style.justifyContent = 'center';
      }
      
      const yesBtn = modal.querySelector('#confirm-yes') as HTMLButtonElement;
      if (yesBtn) {
        yesBtn.style.padding = '8px 16px';
        yesBtn.style.backgroundColor = '#3B82F6';
        yesBtn.style.color = 'white';
        yesBtn.style.border = 'none';
        yesBtn.style.borderRadius = '4px';
        yesBtn.style.cursor = 'pointer';
        yesBtn.addEventListener('click', () => {
          modal.remove();
          resolve(true);
        });
      }
      
      const noBtn = modal.querySelector('#confirm-no') as HTMLButtonElement;
      if (noBtn) {
        noBtn.style.padding = '8px 16px';
        noBtn.style.backgroundColor = '#6B7280';
        noBtn.style.color = 'white';
        noBtn.style.border = 'none';
        noBtn.style.borderRadius = '4px';
        noBtn.style.cursor = 'pointer';
        noBtn.addEventListener('click', () => {
          modal.remove();
          resolve(false);
        });
      }
      
      // 添加到文档
      document.body.appendChild(modal);
    });
  }

  // 获取当前平台的默认快捷键
  private async getDefaultShortcutKey(): Promise<string> {
    try {
      const currentPlatform = await platform();
      // macOS使用Cmd+Control+v，Windows使用Ctrl+Alt+v
      return currentPlatform === 'macos' ? 'Cmd+Control+v' : 'Ctrl+Alt+v';
    } catch {
      // 如果无法获取平台信息，默认为macOS快捷键
      return 'Cmd+Control+v';
    }
  }

  // 加载保存的快捷键并注册全局快捷键
  private async loadShortcutKey(): Promise<string> {
    try {
      const saved = localStorage.getItem('clipboxShortcut');
      if (saved) {
        // 修复Meta键名问题 - 将Meta替换为Cmd
        const fixedKey = saved.replace('Meta', 'Cmd');
        await this.registerGlobalShortcut(fixedKey);
        return fixedKey;
      }
      
      // 如果没有保存的快捷键，获取平台默认快捷键
      const defaultShortcut = await this.getDefaultShortcutKey();
      await this.registerGlobalShortcut(defaultShortcut);
      return defaultShortcut;
    } catch (error) {
      console.error('加载快捷键失败:', error);
      const defaultShortcut = await this.getDefaultShortcutKey();
      await this.registerGlobalShortcut(defaultShortcut);
      return defaultShortcut;
    }
  }

  // 保存快捷键
  private async saveShortcutKey(key: string): Promise<void> {
    try {
      console.log('开始保存快捷键:', key);
      console.log('原快捷键:', this.shortcutKey);
      
      // 先取消注册旧的快捷键
      if (this.shortcutKey && this.shortcutKey !== key) {
        console.log('准备取消注册旧的快捷键:', this.shortcutKey);
        try {
          await this.unregisterGlobalShortcut(this.shortcutKey);
          // 添加一个小延迟，确保取消注册操作完全完成
          await new Promise(resolve => setTimeout(resolve, 100));
          console.log('旧的快捷键已成功取消注册:', this.shortcutKey);
        } catch (unregisterError) {
          console.error('取消注册旧的快捷键失败:', unregisterError);
          // 即使取消注册失败，我们仍然继续尝试注册新的快捷键
        }
      }
      
      // 修复Meta键名问题 - 将Meta替换为Cmd
      const fixedKey = key.replace('Meta', 'Cmd');
      
      localStorage.setItem('clipboxShortcut', fixedKey);
      
      // 注册新的快捷键
      console.log('准备注册新的快捷键:', fixedKey);
      await this.registerGlobalShortcut(fixedKey);
      
      // 更新内部状态
      this.shortcutKey = fixedKey;
      console.log('快捷键保存成功:', fixedKey);
    } catch (error) {
      console.error('保存快捷键失败:', error);
    }
  }

  // 注册全局快捷键
  private async registerGlobalShortcut(key: string): Promise<void> {
    try {
      // 先尝试取消注册，避免重复注册
      try {
        await unregister(key);
      } catch (e) {
        // 忽略取消注册失败的错误
      }
      
      // 添加防抖标志，确保快捷键不会被重复触发
      let isShortcutProcessing = false;
      
      // 注册新的全局快捷键
      await register(key, async () => {
        // 如果当前正在处理快捷键事件，则忽略后续触发
        if (isShortcutProcessing) {
          console.log('忽略重复的快捷键触发:', key);
          return;
        }
        
        try {
          isShortcutProcessing = true;
          console.log('全局快捷键触发:', key);
          await this.toggleAppVisibility();
          
          // 添加一个小延迟，确保在短时间内不会重复处理
          setTimeout(() => {
            isShortcutProcessing = false;
          }, 300);
        } catch (error) {
          console.error('处理快捷键事件失败:', error);
          isShortcutProcessing = false;
        }
      });
      console.log('全局快捷键注册成功:', key);
    } catch (error) {
      console.error('注册全局快捷键失败:', error);
    }
  }

  // 取消注册全局快捷键
  private async unregisterGlobalShortcut(key: string): Promise<void> {
    try {
      await unregister(key);
      console.log('全局快捷键取消注册成功:', key);
    } catch (error) {
      console.error('取消注册全局快捷键失败:', error);
    }
  }

  // 格式化快捷键显示文本
  private formatShortcutDisplay(key: string): string {
    // 先确保key不为空
    if (!key) return '';
    
    // 将Cmd替换为Command，Control替换为Control，确保显示友好的快捷键名称
    return key
      .replace('Cmd', 'Command')
      .replace('Control', 'Control')
      .replace('Shift', 'Shift')
      .replace('Alt', 'Option');
  }

  // 显示快捷键设置模态框
  private showShortcutModal(): void {
    (this.shortcutModal as HTMLElement).style.display = 'flex';
  }

  // 隐藏快捷键设置模态框
  private hideShortcutModal(): void {
    (this.shortcutModal as HTMLElement).style.display = 'none';
    this.stopListeningForShortcut();
  }

  // 开始监听新的快捷键设置
  private startListeningForShortcut(): void {
    this.isListeningForShortcut = true;
    this.shortcutDisplay.textContent = '按下任意键组合...';
    this.shortcutDisplay.classList.add('listening');
    this.setShortcutBtn.disabled = true;
    this.setShortcutBtn.textContent = '设置中...';
    
    // 添加键盘事件监听
    document.addEventListener('keydown', this.handleKeyDownForShortcut);
  }

  // 停止监听新的快捷键设置
  private stopListeningForShortcut(): void {
    this.isListeningForShortcut = false;
    this.shortcutDisplay.textContent = this.formatShortcutDisplay(this.shortcutKey);
    this.shortcutDisplay.classList.remove('listening');
    this.setShortcutBtn.disabled = false;
    this.setShortcutBtn.textContent = '设置快捷键';
    
    // 移除键盘事件监听
    document.removeEventListener('keydown', this.handleKeyDownForShortcut);
  }

  // 重置快捷键为默认值
  private async resetShortcutToDefault(): Promise<void> {
    try {
      const defaultShortcut = await this.getDefaultShortcutKey();
      this.shortcutKey = defaultShortcut;
      this.shortcutKeyInput.value = this.shortcutKey;
      this.shortcutDisplay.textContent = this.formatShortcutDisplay(this.shortcutKey);
      await this.saveShortcutKey(this.shortcutKey);
      console.log('快捷键已重置为默认值');
    } catch (error) {
      console.error('重置快捷键失败:', error);
    }
  }
  
  // 处理键盘事件以设置新的快捷键
  private handleKeyDownForShortcut = async (e: KeyboardEvent): Promise<void> => {
    if (!this.isListeningForShortcut) return;
    
    e.preventDefault();
    e.stopPropagation();

    // 构建快捷键组合
    const modifiers: string[] = [];
    if (e.metaKey) modifiers.push('Cmd');
    if (e.ctrlKey) modifiers.push('Control');
    if (e.shiftKey) modifiers.push('Shift');
    if (e.altKey) modifiers.push('Alt');

    // 确保至少有一个修饰键和一个普通键
    if (modifiers.length > 0 && e.key !== 'Meta' && e.key !== 'Control' && e.key !== 'Shift' && e.key !== 'Alt') {
      const newShortcut = [...modifiers, e.key.toLowerCase()].join('+');
      
      // 保存新的快捷键
      await this.saveShortcutKey(newShortcut);
      this.shortcutKey = newShortcut;
      this.shortcutKeyInput.value = this.shortcutKey;
      
      console.log('新的快捷键已设置:', this.shortcutKey);
      this.stopListeningForShortcut();
    }
  }



  // 切换应用可见性
  private async toggleAppVisibility(): Promise<void> {
    try {
      console.log('开始切换应用可见性');
      
      const result = await invoke('toggle_window_visibility') as boolean;
      console.log('切换应用可见性成功，新的窗口状态:', result ? '显示' : '隐藏');
      
      // 可选：根据需要更新UI状态或提供用户反馈
      // 例如，可以在状态栏显示临时提示
    } catch (error) {
      console.error('切换应用可见性失败:', error);
    }
  }

  private filterHistory(query: string) {
    const items = this.clipboardList.querySelectorAll('.clipboard-item');
    
    items.forEach(item => {
      const content = item.querySelector('.clipboard-content')?.textContent?.toLowerCase() || '';
      const isVisible = content.includes(query);
      (item as HTMLElement).style.display = isVisible ? 'block' : 'none';
    });
  }

  private formatTime(timestamp: number): string {
    const now = Date.now();
    const diff = now - timestamp;
    
    if (diff < 60000) { // 1分钟内
      return '刚刚';
    } else if (diff < 3600000) { // 1小时内
      const minutes = Math.floor(diff / 60000);
      return `${minutes}分钟前`;
    } else if (diff < 86400000) { // 1天内
      const hours = Math.floor(diff / 3600000);
      return `${hours}小时前`;
    } else {
      const date = new Date(timestamp);
      return date.toLocaleDateString('zh-CN', {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    }
  }

  private truncateContent(content: string, maxLength: number = 200): string {
    if (content.length <= maxLength) return content;
    return content.substring(0, maxLength) + '...';
  }

  private render() {
    const filteredItems = this.getFilteredItems();
    
    if (filteredItems.length === 0) {
      const emptyMessage = this.currentFilter === 'favorites' 
        ? '暂无收藏的剪贴板内容'
        : '暂无剪贴板历史';
      const emptyHint = this.currentFilter === 'favorites'
        ? '点击爱心图标收藏重要内容'
        : '复制一些内容开始使用';
        
      this.clipboardList.innerHTML = `
        <div class="empty-state">
          <p>${emptyMessage}</p>
          <p class="hint">${emptyHint}</p>
        </div>
      `;
      return;
    }

    const html = filteredItems.map(item => `
      <div class="clipboard-item ${item.item_type === 'image' ? 'image-item' : ''} ${item.is_favorite ? 'favorite-item' : ''}" data-id="${item.id}">
        <div class="clipboard-content">
        ${item.item_type === 'image' && item.content.startsWith('data:image/') ? 
          `<img src="${item.content}" alt="剪贴板图片" class="clipboard-image" />` : 
          `${item.item_type === 'image' ? '🖼️ ' : ''}${this.truncateContent(item.content)}`
        }
      </div>
        <div class="clipboard-meta">
          <span class="clipboard-time">${this.formatTime(item.timestamp)}</span>
          <div class="clipboard-actions">
            <button class="btn-small favorite-btn ${item.is_favorite ? 'favorited' : ''}" data-id="${item.id}">
              ${item.is_favorite ? '❤️' : '♡'}
            </button>
            <button class="btn-small" onclick="clipBox.copyToClipboard('${item.content.replace(/'/g, "\\'")}', '${item.image_path || ''}')">复制</button>
            <button class="btn-small delete-btn">删除</button>
          </div>
        </div>
      </div>
    `).join('');

    this.clipboardList.innerHTML = html;

    // 添加点击事件
    this.clipboardList.querySelectorAll('.clipboard-item').forEach(item => {
      item.addEventListener('click', (e) => {
        if ((e.target as HTMLElement).tagName === 'BUTTON') return;
        
        const id = (item as HTMLElement).dataset.id;
        const clipboardItem = this.clipboardHistory.find(i => i.id === id);
        if (clipboardItem) {
          // 根据内容类型调用不同的复制方法
          if (clipboardItem.item_type === 'image') {
            // 如果是图片，优先使用image_path（如果有）
            if (clipboardItem.image_path && clipboardItem.image_path !== 'undefined') {
              this.copyImageToClipboard(clipboardItem.image_path);
            } else if (clipboardItem.content.startsWith('data:image/')) {
              // 如果是base64图片，需要先保存为临时文件再复制
              this.copyBase64ImageToClipboard(clipboardItem.content);
            } else {
              // 其他情况仍调用原方法
              this.copyToClipboard(clipboardItem.content, clipboardItem.image_path);
            }
          } else {
            // 非图片内容直接调用原方法
            this.copyToClipboard(clipboardItem.content, clipboardItem.image_path);
          }
          
          // 将当前项移到历史记录的第一位
          this.moveItemToTop(id || '');
        }
      });
    });
    
    // 添加收藏按钮点击事件
    this.clipboardList.querySelectorAll('.favorite-btn').forEach((btn: Element) => {
      btn.addEventListener('click', (e: Event) => {
        e.stopPropagation();
        const id = (btn as HTMLElement).dataset.id;
        if (id) {
          this.toggleFavorite(id);
        }
      });
    });

    // 添加删除按钮点击事件
    this.clipboardList.querySelectorAll('.delete-btn').forEach((btn: Element) => {
      btn.addEventListener('click', (e: Event) => {
        e.stopPropagation();
        const item = (btn as HTMLElement).closest('.clipboard-item');
        if (item) {
          const id = (item as HTMLElement).dataset.id;
          if (id) {
            this.deleteItem(id);
          }
        }
      });
    });
    
    // 确保图片点击事件能冒泡到父元素，触发复制功能
    this.clipboardList.querySelectorAll('.clipboard-image').forEach((image: Element) => {
      (image as HTMLElement).style.pointerEvents = 'auto';
    });
  }
  
  // 将指定ID的项移到历史记录的第一位
  private moveItemToTop(id: string) {
    if (!id) return;
    
    const index = this.clipboardHistory.findIndex(item => item.id === id);
    if (index > 0) {  // 只有当项不在第一位时才需要移动
      // 获取该项
      const item = this.clipboardHistory[index];
      // 从当前位置移除
      this.clipboardHistory.splice(index, 1);
      // 添加到开头
      this.clipboardHistory.unshift(item);
      // 保存并重新渲染
      this.saveHistory();
      this.render();
    }
  }

  // 设置筛选器
  private setFilter(filter: 'all' | 'favorites') {
    this.currentFilter = filter;
    
    // 更新按钮状态
    this.showAllBtn.classList.toggle('active', filter === 'all');
    this.showFavoritesBtn.classList.toggle('active', filter === 'favorites');
    
    // 重新渲染列表
    this.render();
  }

  // 切换收藏状态
  private async toggleFavorite(id: string) {
    console.log('切换收藏状态，ID:', id);
    try {
      const newFavoriteState = await invoke('toggle_favorite_item', { id }) as boolean;
      console.log('新的收藏状态:', newFavoriteState);
      
      // 更新本地状态
      const item = this.clipboardHistory.find(item => item.id === id);
      if (item) {
        item.is_favorite = newFavoriteState;
        console.log('本地状态已更新:', item);
      }
      
      // 保存并重新渲染
      await this.saveHistory();
      this.render();
    } catch (error) {
      console.error('切换收藏状态失败:', error);
    }
  }

  // 获取当前应该显示的项目
  private getFilteredItems(): ClipboardItem[] {
    if (this.currentFilter === 'favorites') {
      // 收藏视图：只显示收藏的项目，按时间倒序
      return this.clipboardHistory
        .filter(item => item.is_favorite)
        .sort((a, b) => b.timestamp - a.timestamp);
    } else {
      // 全部视图：显示所有项目，只按时间倒序，不置顶收藏项目
      return this.clipboardHistory
        .sort((a, b) => b.timestamp - a.timestamp);
    }
  }
}

// 全局实例
let clipBox: ClipBox;

// 页面加载完成后初始化
document.addEventListener('DOMContentLoaded', () => {
  clipBox = new ClipBox();
  // 导出到全局作用域，供 HTML 中的 onclick 使用
  (window as any).clipBox = clipBox;
});