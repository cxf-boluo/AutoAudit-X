#!/bin/bash
# dlog.sh (Dashboard Logger Helper)
# 极简大屏日志发送脚本，降低 LLM Token 消耗
# 用法: ./dlog.sh <from_node> <to_node> "<message>"

if [ "$#" -ne 3 ]; then
    echo "Usage: ./dlog.sh <from_node> <to_node> <message>"
    exit 1
fi

curl -s -X POST http://localhost:3001/api/log \
     -H "Content-Type: application/json" \
     -d "{\"from\": \"$1\", \"to\": \"$2\", \"text\": \"$3\"}" > /dev/null || true
