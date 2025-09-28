import { invoke } from '@tauri-apps/api/core';
import { listen } from '@tauri-apps/api/event';

interface ClipboardItem {
  id: string;
  content: string;
  timestamp: number;
  item_type: 'text' | 'image';
  image_path?: string;
}

class ClipBox {
  private clipboardHistory: ClipboardItem[] = [];
  private maxHistorySize = 100;
  private searchInput: HTMLInputElement;
  private clipboardList: HTMLElement;
  private clearAllBtn: HTMLButtonElement;
  private toggleTopBtn: HTMLButtonElement;
  private minimizeBtn: HTMLButtonElement;

  constructor() {
    this.searchInput = document.getElementById('search-input') as HTMLInputElement;
    this.clipboardList = document.getElementById('clipboard-list') as HTMLElement;
    this.clearAllBtn = document.getElementById('clear-all-btn') as HTMLButtonElement;
    this.toggleTopBtn = document.getElementById('toggle-top-btn') as HTMLButtonElement;
    this.minimizeBtn = document.getElementById('minimize-btn') as HTMLButtonElement;
    
    this.init();
  }

  private async init() {
    console.log('初始化 ClipBox...');
    
    // 加载历史数据
    await this.loadHistory();
    console.log('历史数据加载完成:', this.clipboardHistory.length);
    
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

    // 最小化
    this.minimizeBtn.addEventListener('click', async () => {
      try {
        await invoke('minimize_to_tray');
      } catch (error) {
        console.error('最小化失败:', error);
      }
    });

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
      image_path: isImage ? content : undefined
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
    if (this.clipboardHistory.length === 0) {
      this.clipboardList.innerHTML = `
        <div class="empty-state">
          <p>暂无剪贴板历史</p>
          <p class="hint">复制一些内容开始使用</p>
        </div>
      `;
      return;
    }

    const html = this.clipboardHistory.map(item => `
      <div class="clipboard-item ${item.item_type === 'image' ? 'image-item' : ''}" data-id="${item.id}">
        <div class="clipboard-content">
        ${item.item_type === 'image' && item.content.startsWith('data:image/') ? 
          `<img src="${item.content}" alt="剪贴板图片" class="clipboard-image" />` : 
          `${item.item_type === 'image' ? '🖼️ ' : ''}${this.truncateContent(item.content)}`
        }
      </div>
        <div class="clipboard-meta">
          <span class="clipboard-time">${this.formatTime(item.timestamp)}</span>
          <div class="clipboard-actions">
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
}

// 全局实例
let clipBox: ClipBox;

// 页面加载完成后初始化
document.addEventListener('DOMContentLoaded', () => {
  clipBox = new ClipBox();
  // 导出到全局作用域，供 HTML 中的 onclick 使用
  (window as any).clipBox = clipBox;
});