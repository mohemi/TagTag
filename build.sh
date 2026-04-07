#!/bin/bash

# TagTag 插件一键打包脚本
# 用法: ./build.sh

set -e

echo "🚀 TagTag 插件打包工具"
echo "======================"

# 检查是否安装了依赖
if [ ! -d "node_modules" ]; then
    echo "📦 正在安装依赖..."
    npm install
    echo "✅ 依赖安装完成"
    echo ""
fi

# 清理旧的构建
echo "🧹 清理旧的构建文件..."
rm -rf dist
rm -f TagTag-*.zip
echo "✅ 清理完成"
echo ""

# 执行混淆打包
echo "🔒 开始混淆打包..."
node obfuscate.js
echo ""

# 生成 ZIP 文件
# 生成 ZIP 文件
echo "📦 生成发布包..."
version=$(grep '"version"' manifest.json | cut -d'"' -f4)
zip_name="TagTag-${version}.zip"

cd dist
zip -r "../${zip_name}" . -x "*.DS_Store" -x "__MACOSX/*" -x "*.map"
cd ..

echo ""
echo "======================"
echo "✅ 打包完成!"
echo ""
echo "📁 输出文件:"
echo "   - dist/          (混淆后的插件目录)"
echo "   - ${zip_name}    (可直接发布的压缩包)"
echo ""
echo "📝 使用方式:"
echo "   1. 打开 Chrome 扩展管理页面 (chrome://extensions/)"
echo "   2. 开启'开发者模式'"
echo "   3. 将 ${zip_name} 拖拽到页面中安装"
echo ""
