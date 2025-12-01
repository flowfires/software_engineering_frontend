#!/bin/bash

# 安装依赖
pip install -r requirements.txt

# 启动应用
uvicorn main:app --reload --host 0.0.0.0 --port 8000
