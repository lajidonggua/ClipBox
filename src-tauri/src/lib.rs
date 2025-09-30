use std::collections::VecDeque;
use std::sync::{Arc, Mutex};
use tauri::{AppHandle, Emitter, State, Window, Manager, Listener};
// 不使用clipboard-manager插件，继续使用原有的轮询实现
use base64::{Engine as _, engine::general_purpose::STANDARD as BASE64_ENGINE};

// 需要添加 serde 库的导入以使用 Serialize 和 Deserialize 宏
use serde::{Serialize, Deserialize};
#[derive(Debug, Serialize, Deserialize, Clone)]

pub struct ClipboardItem {
    pub id: String,
    pub content: String,
    pub timestamp: u64,
    pub item_type: String,
    pub image_path: Option<String>,
}

pub struct ClipboardState {
    pub history: Arc<Mutex<VecDeque<ClipboardItem>>>,
    pub last_content: Arc<Mutex<String>>,
}

impl ClipboardState {
    pub fn new() -> Self {
        Self {
            history: Arc::new(Mutex::new(VecDeque::new())),
            last_content: Arc::new(Mutex::new(String::new())),
        }
    }
}

#[tauri::command]
fn greet(name: &str) -> String {
    format!("Hello, {}! You've been greeted from Rust!", name)
}

#[tauri::command]
fn start_clipboard_monitor(state: State<ClipboardState>, app: AppHandle) {
    let history = state.history.clone();
    let last_content = state.last_content.clone();
    
    // 注意：由于Tauri 2的clipboard-manager插件API与之前版本不同，
    // 这里简化实现，使用原来的get_clipboard_content函数进行轮询
    std::thread::spawn(move || {
        loop {
            std::thread::sleep(std::time::Duration::from_millis(1000));
            
            match get_clipboard_content() {
                Ok(content) => {
                    println!("获取到剪贴板内容: {:?}", content);
                    // 避免处理包含错误日志的内容，防止循环
                    if content.contains("execution error") || content.contains("osascript 输出") {
                        continue;
                    }
                    
                    let mut last = last_content.lock().unwrap();
                    if *last != content {
                        *last = content.clone();
                        
                        let item = ClipboardItem {
                            id: format!("{}", std::time::SystemTime::now()
                                .duration_since(std::time::UNIX_EPOCH)
                                .unwrap()
                                .as_millis()),
                            content: content.clone(),
                            timestamp: std::time::SystemTime::now()
                                .duration_since(std::time::UNIX_EPOCH)
                                .unwrap()
                                .as_secs(),
                            item_type: "text".to_string(),
                            image_path: None,
                        };
                        
                        let mut hist = history.lock().unwrap();

                        println!("item: {:?}", item);
                        hist.push_front(item);
                        
                        // 限制历史记录数量
                        if hist.len() > 100 {
                            hist.pop_back();
                        }
                        
                        // 发送事件到前端
                        if let Err(e) = app.emit("clipboard-changed", &content) {
                            println!("发送事件失败: {}", e);
                        }
                    }
                },
                Err(e) => {
                    println!("获取剪贴板内容失败: {}", e);
                }
            }
        }
    });
}

#[tauri::command]
fn get_clipboard_history(state: State<ClipboardState>) -> Vec<ClipboardItem> {
    let history = state.history.lock().unwrap();
    history.iter().cloned().collect()
}

#[tauri::command]
fn save_clipboard_history(history: Vec<ClipboardItem>, state: State<ClipboardState>) {
    let mut hist = state.history.lock().unwrap();
    *hist = history.into_iter().collect();
}

#[tauri::command]
fn write_to_clipboard(_app: AppHandle, content: String) -> Result<(), String> {
    set_clipboard_content(&content)
}

#[tauri::command]
fn copy_image_to_clipboard(_app: AppHandle, image_path: String) -> Result<(), String> {
    copy_image_from_file(&image_path)
}

#[tauri::command]
fn copy_base64_image_to_clipboard(_app: AppHandle, base64_content: String) -> Result<(), String> {
    // 从Base64内容中提取图片数据
    let data_parts: Vec<&str> = base64_content.split(',').collect();
    if data_parts.len() < 2 {
        return Err("Invalid base64 image format".to_string());
    }
    
    let base64_data = data_parts[1];
    
    // 解码Base64数据
    let image_data = BASE64_ENGINE.decode(base64_data)
        .map_err(|e| format!("Failed to decode base64: {}", e))?;
    
    // 保存到临时文件
    // 由于未引入uuid crate，使用当前时间戳作为临时文件名的唯一标识
    let temp_file = format!("/tmp/tauri_clip_{}.png", std::time::SystemTime::now()
        .duration_since(std::time::UNIX_EPOCH)
        .unwrap()
        .as_millis());
    
    std::fs::write(&temp_file, &image_data)
        .map_err(|e| format!("Failed to write temp file: {}", e))?;
    
    // 使用已有的复制图片函数
    let result = copy_image_from_file(&temp_file);
    
    // 清理临时文件（忽略错误）
    let _ = std::fs::remove_file(&temp_file);
    
    result
}

#[tauri::command]
fn get_image_base64(image_path: String) -> Result<String, String> {
    use std::fs::File;
    use std::io::Read;
    
    let mut file = File::open(&image_path).map_err(|e| format!("Failed to open image file: {}", e))?;
    let mut buffer = Vec::new();
    file.read_to_end(&mut buffer).map_err(|e| format!("Failed to read image file: {}", e))?;
    
    let base64 = BASE64_ENGINE.encode(&buffer);
    Ok(format!("data:image/png;base64,{}", base64))
}

fn copy_image_from_file(image_path: &str) -> Result<(), String> {
    // 首先检查文件是否存在
    use std::path::Path;
    if !Path::new(image_path).exists() {
        return Err(format!("Image file does not exist: {}", image_path));
    }
    
    #[cfg(target_os = "macos")]
    {
        use std::process::Command;
        
        let output = Command::new("osascript")
            .args(&[
                "-e",
                &format!("set the clipboard to (read (POSIX file \"{}\") as «class PNGf»)", image_path)
            ])
            .output()
            .map_err(|e| format!("Failed to execute osascript: {}", e))?;
        
        // 输出详细的错误信息
        let stderr = String::from_utf8_lossy(&output.stderr).to_string();
        
        if output.status.success() {
            Ok(())
        } else {
            Err(format!("Failed to copy image to clipboard: {}. Image path: {}", stderr, image_path))
        }
    }
    
    #[cfg(target_os = "windows")]
    {
        use std::process::Command;
        
        let output = Command::new("powershell")
            .args(&[
                "-command",
                &format!("Set-Clipboard -Path '{}'", image_path)
            ])
            .output()
            .map_err(|e| format!("Failed to execute powershell: {}", e))?;
        
        // 输出详细的错误信息
        let stderr = String::from_utf8_lossy(&output.stderr).to_string();
        
        if output.status.success() {
            Ok(())
        } else {
            Err(format!("Failed to copy image to clipboard: {}. Image path: {}", stderr, image_path))
        }
    }
    
    #[cfg(not(any(target_os = "macos", target_os = "windows")))]
    {
        Err(format!("Unsupported platform. Image path: {}", image_path))
    }
}

fn get_clipboard_content() -> Result<String, String> {
    #[cfg(target_os = "macos")]
    {
        use std::process::Command;
        
        // 执行pbpaste命令获取剪贴板文本内容
        let text_output = Command::new("pbpaste")
            .output()
            .map_err(|e| format!("Failed to get clipboard: {}", e))?;
        
        // 不输出pbpaste的原始输出，避免被捕获回剪贴板导致循环
        
        if text_output.status.success() {
            let text = String::from_utf8_lossy(&text_output.stdout).to_string();
            if !text.trim().is_empty() {
                // 检查是否已经是base64图片格式，如果是，直接返回，避免循环处理
                if text.starts_with("data:image/") && text.contains("base64,") {
                    println!("检测到已处理的base64图片格式，直接返回");
                    return Ok(text);
                }
                
                // 避免处理包含错误日志的内容，防止循环
                if text.contains("execution error") || text.contains("osascript 输出") {
                    println!("检测到可能是日志内容，跳过处理");
                    return Ok(String::new());
                }
                
                return Ok(text);
            }
        }
        
        // 使用try-catch方式尝试获取并转换图片为base64，避免在没有图片时出错
        let tmp_file = "/tmp/tauri_clip.png";

        let image_check = Command::new("osascript")
            .args(&[
                "-e", "try",
                "-e", &format!("set imageData to the clipboard as «class PNGf»"),
                "-e", &format!("set theFile to \"{}\"", tmp_file),
                "-e", "set fd to open for access theFile with write permission",
                "-e", "write imageData to fd",
                "-e", "close access fd",
                "-e", "on error",
                "-e", "return \"\"",
                "-e", "end try"
            ])
            .output();
        
        
        println!("osascript 输出: {:?}", image_check);
        // 判断临时文件是否存在且有内容
        let base64_output = Command::new("sh")
            .args(&["-c", &format!("[ -s {} ] && base64 -i {} || echo ''", tmp_file, tmp_file)])
            .output()
            .map_err(|e| e.to_string())?;
        println!("osascript base64_output 输出: {:?}", base64_output);

        let base64_str = String::from_utf8_lossy(&base64_output.stdout).trim().to_string();
        println!("osascript base64_str 输出: {:?}", base64_str);

        if !base64_str.is_empty() {
            println!("检测到图片数据，已转换为base64");
            return Ok(format!("data:image/png;base64,{}", base64_str));
        }
        
        Ok(String::new())
    }
    
    #[cfg(target_os = "windows")]
    {
        use std::process::Command;
        
        // 尝试获取文本内容
        let text_output = Command::new("powershell")
            .args(&["-command", "Get-Clipboard -Format Text"])
            .output()
            .map_err(|e| format!("Failed to get clipboard: {}", e))?;
        
        if text_output.status.success() {
            let text = String::from_utf8_lossy(&text_output.stdout).to_string();
            if !text.trim().is_empty() {
                // 检查是否已经是base64图片格式，如果是，直接返回，避免循环处理
                if text.starts_with("data:image/") && text.contains("base64,") {
                    println!("检测到已处理的base64图片格式，直接返回");
                    return Ok(text);
                }
                return Ok(text);
            }
        }
        
        // 检查是否有图片并直接转换为base64
        let image_script = r#"
        $tempPath = [System.IO.Path]::GetTempFileName() + '.png'
        try {
            # 尝试获取剪贴板中的图片
            $image = Get-Clipboard -Format Image
            if ($image -ne $null) {
                # 保存到临时文件
                $image.Save($tempPath, [System.Drawing.Imaging.ImageFormat]::Png)
                # 读取文件并转换为base64
                $bytes = [System.IO.File]::ReadAllBytes($tempPath)
                $base64 = [System.Convert]::ToBase64String($bytes)
                Write-Output $base64
            }
        } catch {
            # 忽略错误
        } finally {
            # 清理临时文件
            if (Test-Path $tempPath) {
                Remove-Item $tempPath -Force
            }
        }
        "#;
        
        let image_output = Command::new("powershell")
            .args(&["-command", &image_script])
            .output();
        
        if let Ok(output) = image_output {
            if output.status.success() {
                let base64 = String::from_utf8_lossy(&output.stdout).trim().to_string();
                if !base64.is_empty() {
                    println!("检测到图片数据，已转换为base64");
                    return Ok(format!("data:image/png;base64,{}", base64));
                }
            }
        }
        
        Ok(String::new())
    }
    
    #[cfg(not(any(target_os = "macos", target_os = "windows")))]
    {
        Err("Unsupported platform".to_string())
    }
}

fn set_clipboard_content(content: &str) -> Result<(), String> {
    #[cfg(target_os = "macos")]
    {
        use std::process::Command;
        let mut child = Command::new("pbcopy")
            .stdin(std::process::Stdio::piped())
            .spawn()
            .map_err(|e| format!("Failed to set clipboard: {}", e))?;
        
        if let Some(stdin) = child.stdin.as_mut() {
            use std::io::Write;
            stdin.write_all(content.as_bytes())
                .map_err(|e| format!("Failed to write to clipboard: {}", e))?;
        }
        
        child.wait()
            .map_err(|e| format!("Failed to wait for pbcopy: {}", e))?;
        
        Ok(())
    }
    
    #[cfg(target_os = "windows")]
    {
        use std::process::Command;
        let output = Command::new("powershell")
            .args(&["-command", &format!("Set-Clipboard -Value '{}'", content)])
            .output()
            .map_err(|e| format!("Failed to set clipboard: {}", e))?;
        
        if output.status.success() {
            Ok(())
        } else {
            Err("Failed to set clipboard content ".to_string())
        }
    }
    
    #[cfg(not(any(target_os = "macos", target_os = "windows")))]
    {
        Err("Unsupported platform".to_string())
    }
}

#[tauri::command]
fn toggle_always_on_top(window: Window) -> Result<(), String> {
    let is_always_on_top = window.is_always_on_top().map_err(|e| e.to_string())?;
    window.set_always_on_top(!is_always_on_top).map_err(|e| e.to_string())?;
    Ok(())
}

#[tauri::command]
fn minimize_to_tray(window: Window) -> Result<(), String> {
    window.hide().map_err(|e| e.to_string())?;
    Ok(())
}

#[tauri::command]
fn toggle_window_visibility(window: Window) -> Result<bool, String> {
    println!("收到toggle_window_visibility命令");
    
    // 先检查当前窗口可见性状态
    let is_visible = window.is_visible().map_err(|e| e.to_string())?;
    println!("当前窗口可见性: {}", is_visible);
    
    // 根据当前状态切换窗口可见性
    if is_visible {
        // 如果当前可见，则隐藏窗口
        window.hide().map_err(|e| e.to_string())?;
        println!("隐藏窗口成功");
        Ok(false) // 返回新的可见性状态
    } else {
        // 如果当前不可见，则显示窗口
        if window.is_minimized().unwrap_or(false) {
            window.unminimize().unwrap();
        } else {
            window.show().unwrap();
        }
        window.set_focus().unwrap();
        Ok(true) // 返回新的可见性状态
    }
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    let app = tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_global_shortcut::Builder::default().build())
        .manage(ClipboardState::new())
        .invoke_handler(tauri::generate_handler![
            greet,
            start_clipboard_monitor,
            get_clipboard_history,
            save_clipboard_history,
            write_to_clipboard,
            copy_image_to_clipboard,
            copy_base64_image_to_clipboard,
            get_image_base64,
            toggle_always_on_top,
            minimize_to_tray,
            toggle_window_visibility
        ])
        .setup(|app| {
            // 获取主窗口
            let handle = app.handle(); // 👈 从 App 拿到 AppHandle

            if let Some(window) = handle.get_webview_window("main") {
                // 监听事件
                window.listen("tauri://focus", move |_event| {
                    println!("Main window focused!");
                });

                window.listen("tauri://close-requested", move |_event| {
                    println!("Close requested!");
                    // 这里可以 window.close().unwrap() 或 window.hide().unwrap()
                });
            }

            Ok(())
        })
        .on_window_event(|window, event| {
            if let tauri::WindowEvent::CloseRequested { api, .. } = event {
                println!("收到关闭请求，尝试隐藏到托盘");
                // 阻止默认关闭行为，改为隐藏到托盘
                window.hide().ok(); // 隐藏窗口        
                api.prevent_close();
            }
        })
        .build(tauri::generate_context!())
        .expect("error while running tauri application ");

    app.run(|app_handle, event| match event {
        tauri::RunEvent::Reopen { has_visible_windows, .. } => {
            println!("收到重新打开事件，has_visible_windows: {}", has_visible_windows);
            if let Some(window) = app_handle.get_webview_window("main") {
                if window.is_minimized().unwrap_or(false) {
                    window.unminimize().unwrap();
                } else {
                    window.show().unwrap();
                }
                window.set_focus().unwrap();
            }
        }
        _ => {}
    });
}