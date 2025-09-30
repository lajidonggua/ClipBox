// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

fn main() {
    println!("LANG = {:?}", std::env::var("LANG"));
    println!("LC_ALL = {:?}", std::env::var("LC_ALL")); 
    // 确保双击 .app 时也能用 UTF-8
    std::env::set_var("LANG", "zh_CN.UTF-8");
    std::env::set_var("LC_ALL", "zh_CN.UTF-8");

    println!("LANG = {:?}", std::env::var("LANG"));
    println!("LC_ALL = {:?}", std::env::var("LC_ALL")); 
    clipbox_lib::run()
}
