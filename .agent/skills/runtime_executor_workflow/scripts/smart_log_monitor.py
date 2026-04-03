#!/usr/bin/env python3
import subprocess
import time
import argparse
import json
import os
import re
import sys

def main():
    parser = argparse.ArgumentParser(description="Smart Log Monitor for AutoAudit-X Runtime Executor")
    parser.add_argument("-p", "--package", required=True, help="Target application package name")
    parser.add_argument("-t", "--timeout", type=int, default=30, help="Listen timeout in seconds (default 30)")
    parser.add_argument("-o", "--output-dir", required=True, help="Directory to save the JSON evidence")
    args = parser.parse_args()

    # Clear old logcat
    print(f"[*] 清理历史 Logcat 数据...")
    subprocess.run(["adb", "logcat", "-c"], check=False)

    # Output directory
    os.makedirs(args.output_dir, exist_ok=True)
    report_path = os.path.join(args.output_dir, f"hook_evidence_{args.package}_{int(time.time())}.json")

    # Start the app
    print(f"[*] 启动目标应用: {args.package}")
    subprocess.run(["adb", "shell", "monkey", "-p", args.package, "1"], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)

    print(f"[*] 开始智能捕获 Hook 日志 (最大监听时长 {args.timeout} 秒)...")
    
    # We use a non-blocking process to read logcat
    # Filter only relevant tags: Pine, HookLogic
    process = subprocess.Popen(["adb", "logcat", "-v", "time", "-s", "Pine", "HookLogic"], 
                               stdout=subprocess.PIPE, 
                               stderr=subprocess.PIPE,
                               universal_newlines=True)
                               
    start_time = time.time()
    evidence = []
    
    # Regex to clean up standard android logcat prefixes
    # Matches: "03-16 16:34:15.560 I/Pine    (13501): 🔐 SSLContext..."
    # Matches: "03-16 16:34:15.560 13501 14659 I Pine    : 🔐 SSLContext..."
    log_content_regex = re.compile(r'(Pine|HookLogic)\s*:\s*(.*)')

    try:
        while time.time() - start_time < args.timeout:
            # check if process has lines
            # use select or just readline if we are fine with slight blocking
            # wait with short timeout, wait for readline
            # readline can block permanently if nothing outputs, but we expect at least some logs.
            # To avoid permanent blocking, we just use communicate with timeout if needed, but readline is easier.
            
            pass # We will read line by line but it might block. For simplicity in Python, we'll read line by line.
            # However, standard Popen.stdout.readline blocks. 
            # We can use os.set_blocking.
            pass
    except Exception as e:
        pass
        
    # Better approach: Read lines with a timeout using select (Unix only)
import selectors

def run_smart_monitor():
    parser = argparse.ArgumentParser(description="Smart Log Monitor for AutoAudit-X Runtime Executor")
    parser.add_argument("-p", "--package", required=True, help="Target application package name")
    parser.add_argument("-t", "--timeout", type=int, default=30, help="Listen timeout in seconds (default: 30)")
    parser.add_argument("-o", "--output-dir", required=True, help="Directory to save the JSON evidence")
    args = parser.parse_args()

    print(f"[*] 清理历史 Logcat 数据并强制停止应用...")
    subprocess.run(["adb", "logcat", "-c"], check=False)
    subprocess.run(["adb", "shell", "am", "force-stop", args.package], check=False)
    
    os.makedirs(args.output_dir, exist_ok=True)
    report_path = os.path.join(args.output_dir, f"hook_evidence_{args.package}_{int(time.time())}.json")

    print(f"[*] 启动目标应用: {args.package}")
    subprocess.run(["adb", "shell", "monkey", "-p", args.package, "1"], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)

    print(f"[*] 开始智能捕获 Hook 日志 (最大监听时长 {args.timeout} 秒)...")
    
    process = subprocess.Popen(["adb", "logcat", "-s", "Pine", "HookLogic"], 
                               stdout=subprocess.PIPE, 
                               universal_newlines=True)
                               
    start_time = time.time()
    evidence = []
    
    if process.stdout is None:
        print("[-] 无法读取 subprocess 的 stdout。")
        return

    sel = selectors.DefaultSelector()
    sel.register(process.stdout, selectors.EVENT_READ)
    
    # regex to match "Pine    : " or "I/Pine   (1234): "
    log_content_regex = re.compile(r'(?:Pine|HookLogic).*?:\s*(.*)')

    try:
        while time.time() - start_time < args.timeout:
            events = sel.select(timeout=1.0)
            if events:
                line = process.stdout.readline()
                if not line:
                    break
                line = line.strip()
                if not line:
                    continue
                    
                match = log_content_regex.search(line)
                if match:
                    clean_msg = match.group(1).strip()
                    if clean_msg:
                        # Print cleanly to the Agent's console
                        print(f"🔔 {clean_msg}")
                        evidence.append({
                            "timestamp": time.strftime("%H:%M:%S"),
                            "raw_logcat": line,
                            "clean_message": clean_msg
                        })
    except KeyboardInterrupt:
        print("\n[*] 用户主动中断监听。")
    finally:
        process.terminate()
        try:
            process.wait(timeout=2)
        except subprocess.TimeoutExpired:
            process.kill()
        sel.close()
        
    print("\n" + "="*50)
    print(f"[*] 监听结束，共捕获到 {len(evidence)} 条有效的 Hook 日志。")
    if evidence:
        with open(report_path, "w", encoding="utf-8") as f:
            json.dump({
                "package": args.package, 
                "capture_time": time.strftime("%Y-%m-%d %H:%M:%S"),
                "total_items": len(evidence),
                "evidence": evidence
            }, f, ensure_ascii=False, indent=2)
        print(f"[+] 实战证据已自动保存为 JSON 结构化文件: \n    {report_path}")
        print("    (Agent) 提示: 请直接读取上述 JSON 文件内容，以获得清晰、无杂乱干扰的关键运行数据！")
    else:
        print("[-] 未能捕获到任何有效数据，可能 Hook 未成功或应用未生成输出。")
    print("="*50)

if __name__ == "__main__":
    run_smart_monitor()
