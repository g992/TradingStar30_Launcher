// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use std::process::Stdio;
// use std::sync::{Arc, Mutex}; // <-- Удалено
use tokio::process::{Command, Child};
use tokio::sync::Mutex as TokioMutex;
// Используем Tokio BufReader и AsyncBufReadExt
use tokio::io::{BufReader as TokioBufReader, AsyncBufReadExt};
// Добавляем Emitter, убираем Manager
use tauri::{AppHandle, Emitter, Runtime, State, Manager};
// use futures::stream::{StreamExt}; // <-- Удаляем неиспользуемый импорт

// --- Состояние для хранения дочернего процесса ---
struct AppState {
    child_process: TokioMutex<Option<Child>>,
}

impl AppState {
    fn new() -> Self {
        Self { child_process: TokioMutex::new(None) }
    }
}
// --- Конец состояния ---

#[derive(serde::Serialize, Clone)] // Добавляем Clone
struct Payload {
    message: String,
}

// --- Команда для запуска процесса ---
#[tauri::command]
async fn start_external_app<R: Runtime>(
    app_handle: AppHandle<R>,
    state: State<'_, AppState>, // <-- Возвращаем State<AppState>
    app_path: String,
    api_key: String,
) -> Result<(), String> {
    let mut child_lock = state.child_process.lock().await;

    if child_lock.is_some() {
        return Err("Приложение уже запущено.".to_string());
    }

    println!("[Rust] Запуск: {} с ключом {}", app_path, if api_key.is_empty() {"пусто"} else {&api_key});

    let mut command = Command::new(&app_path);
    command.arg("-k");
    command.arg(api_key);
    command.stdout(Stdio::piped());
    command.stderr(Stdio::piped());

    match command.spawn() {
        Ok(mut child) => {
            println!("[Rust] Процесс запущен, PID: {:?}", child.id());
            
            let stdout = child.stdout.take().expect("Failed to capture stdout");
            let stderr = child.stderr.take().expect("Failed to capture stderr");

            // Асинхронно читаем stdout
            let app_handle_stdout = app_handle.clone();
            tokio::spawn(async move {
                let reader = TokioBufReader::new(stdout); // <-- Используем Tokio BufReader
                let mut lines = reader.lines(); // <-- Используем метод lines() из AsyncBufReadExt
                // Используем next_line() для чтения
                while let Ok(Some(line)) = lines.next_line().await {
                    println!("[App Output]: {}", line);
                    // Emitter теперь в области видимости
                    app_handle_stdout.emit("app-output", Payload { message: line })
                        .expect("Failed to emit stdout event");
                }
                // Обработка ошибки чтения потока (если нужно)
                 println!("[Rust] Stdout reader finished.");
            });

            // Асинхронно читаем stderr
            let app_handle_stderr = app_handle.clone();
            tokio::spawn(async move {
                let reader = TokioBufReader::new(stderr); // <-- Используем Tokio BufReader
                let mut lines = reader.lines(); // <-- Используем метод lines() из AsyncBufReadExt
                 // Используем next_line() для чтения
                while let Ok(Some(line)) = lines.next_line().await {
                    eprintln!("[App Error]: {}", line);
                    // Emitter теперь в области видимости
                    app_handle_stderr.emit("app-output", Payload { message: format!("ERROR: {}", line) })
                        .expect("Failed to emit stderr event");
                }
                 // Обработка ошибки чтения потока (если нужно)
                 println!("[Rust] Stderr reader finished.");
            });

             // --- Сохраняем процесс перед тем, как освободить замок --- 
            let child_to_run = Some(child);
            *child_lock = child_to_run; // Сохраняем в state
            // Освобождаем замок *до* спавна задачи ожидания
             drop(child_lock);

            // Асинхронно ждем завершения процесса
            let app_handle_close = app_handle.clone();
            // --- Убираем захват state_close --- 
            // let state_close = state.inner().clone(); 
            tokio::spawn(async move {
                 // --- Получаем state внутри задачи --- 
                let state_in_task = app_handle_close.try_state::<AppState>();
                // Берем процесс из состояния
                let child_to_wait = state_in_task.clone().unwrap().child_process.lock().await.take(); 

                if let Some(mut child_process_instance) = child_to_wait {
                    match child_process_instance.wait().await { // Используем переименованную переменную
                        Ok(status) => {
                            println!("[Rust] Процесс завершился со статусом: {}", status);
                            app_handle_close.emit("app-terminated", Payload { message: format!("Код завершения: {}", status.code().unwrap_or(-1)) })
                                .expect("Failed to emit terminated event");
                        }
                        Err(e) => {
                            eprintln!("Error waiting for child process: {}", e);
                            app_handle_close.emit("app-error", Payload { message: format!("Ошибка ожидания процесса: {}", e) })
                                .expect("Failed to emit wait error event");
                        }
                    }
                } else {
                     println!("[Rust] Процесс уже был завершен или отсутствует в состоянии (в задаче ожидания).");
                }
                let binding = state_in_task.unwrap();
                // Дополнительная проверка и очистка состояния, если необходимо
                let mut final_lock = binding.child_process.lock().await;
                if final_lock.is_some() {
                    println!("[Rust] Cleaning up lingering process state after wait task.");
                    *final_lock = None;
                }
            });

            Ok(())
        }
        Err(e) => {
            eprintln!("Failed to spawn command: {}", e);
            Err(format!("Ошибка запуска команды: {}", e))
        }
    }
}

// --- Команда для остановки процесса ---
#[tauri::command]
async fn kill_external_app(state: State<'_, AppState>) -> Result<(), String> { // <-- Возвращаем State<AppState>
    let mut child_lock = state.child_process.lock().await;

    if let Some(child) = child_lock.as_mut() {
        println!("[Rust] Попытка остановить процесс PID: {:?}", child.id());
        match child.kill().await {
            Ok(_) => {
                println!("[Rust] Сигнал kill отправлен процессу.");
                Ok(())
            }
            Err(e) => {
                eprintln!("Failed to kill process: {}", e);
                *child_lock = None;
                Err(format!("Ошибка остановки процесса: {}", e))
            }
        }
    } else {
        println!("[Rust] Процесс для остановки не найден.");
        Err("Приложение не запущено.".to_string())
    }
}

#[tokio::main]
async fn main() {
    tauri::Builder::default()
        .manage(AppState::new())
        .invoke_handler(tauri::generate_handler![
            start_external_app,
            kill_external_app
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
