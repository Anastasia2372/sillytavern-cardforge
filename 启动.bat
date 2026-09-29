@echo off
chcp 65001 >nul
setlocal
title SillyTavern CardForge

pushd "%~dp0"
if errorlevel 1 goto directory_error

where node.exe >nul 2>&1
if errorlevel 1 goto node_error
where npm.cmd >nul 2>&1
if errorlevel 1 goto node_error

node -e "const [major, minor] = process.versions.node.split('.').map(Number); process.exit((major === 20 && minor >= 19) || (major === 22 && minor >= 12) || major >= 24 ? 0 : 1)"
if errorlevel 1 goto node_error

if not exist "node_modules\.bin\vite.cmd" goto install
if not exist "node_modules\.bin\electron.cmd" goto install
if not exist "node_modules\electron\dist\electron.exe" goto install
goto build

:install
echo [1/3] 首次运行或依赖不完整，正在安装依赖，请保持网络连接……
call npm.cmd install --include=dev --no-audit --no-fund
if errorlevel 1 goto install_error

:build
if exist "node_modules\electron\dist\electron.exe" goto build_ui
echo 正在补全 Electron 运行文件……
call npm.cmd rebuild electron
if errorlevel 1 goto install_error
if not exist "node_modules\electron\dist\electron.exe" goto install_error

:build_ui
echo [2/3] 正在构建界面……
call npm.cmd run build
if errorlevel 1 goto build_error

echo [3/3] 正在启动 CardForge，关闭应用后此窗口会自动退出。
set "NODE_ENV=production"
set "ELECTRON_RUN_AS_NODE="
call "node_modules\.bin\electron.cmd" .
if errorlevel 1 goto launch_error
popd
endlocal
exit /b 0

:node_error
echo [错误] 请安装 Node.js 22.12+ 或 24+ LTS，并确保安装时添加到 PATH。
echo 下载地址：https://nodejs.org/
echo 安装完成后，重新双击本启动器。
goto failed

:install_error
echo [错误] 依赖安装失败，请检查上方报错和网络连接，然后重新运行。
goto failed

:build_error
echo [错误] 界面构建失败，请查看上方报错。
goto failed

:launch_error
echo [错误] CardForge 启动或运行失败，请查看上方报错。
goto failed

:failed
popd
pause
endlocal
exit /b 1

:directory_error
echo [错误] 无法进入项目目录，请将启动器保留在仓库根目录。
pause
endlocal
exit /b 1
