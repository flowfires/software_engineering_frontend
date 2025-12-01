@echo off

REM 安装依赖
pip install -r requirements.txt

REM 启动应用
uvicorn main:app --reload --host 0.0.0.0 --port 8000
