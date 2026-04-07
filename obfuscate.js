const JavaScriptObfuscator = require('javascript-obfuscator');
const fs = require('fs');
const path = require('path');

// 通用混淆配置（适用于 options/popup）
const obfuscationConfig = {
  compact: true,
  controlFlowFlattening: true,
  controlFlowFlatteningThreshold: 0.75,
  deadCodeInjection: true,
  deadCodeInjectionThreshold: 0.4,
  debugProtection: false,
  debugProtectionInterval: 0,
  disableConsoleOutput: true,
  identifierNamesGenerator: 'hexadecimal',
  log: false,
  numbersToExpressions: true,
  renameGlobals: false,
  selfDefending: false,  // 禁用自我防御，避免使用 window
  simplify: true,
  splitStrings: true,
  splitStringsChunkLength: 10,
  stringArray: true,
  stringArrayCallsTransform: true,
  stringArrayEncoding: ['base64'],
  stringArrayIndexShift: true,
  stringArrayRotate: true,
  stringArrayShuffle: true,
  stringArrayWrappersCount: 2,
  stringArrayWrappersChainedCalls: true,
  stringArrayWrappersParametersMaxCount: 4,
  stringArrayWrappersType: 'function',
  stringArrayThreshold: 0.75,
  transformObjectKeys: true,
  unicodeEscapeSequence: false
};

// Service Worker 专用配置（不能使用 window 对象）
const serviceWorkerConfig = {
  ...obfuscationConfig,
  // Service Worker 特殊配置
  disableConsoleOutput: false,  // 不禁用 console，避免访问 window.console
  selfDefending: false,         // 禁用自我防御
  deadCodeInjection: false,     // 减少可能导致问题的代码
  controlFlowFlattening: true,
  controlFlowFlatteningThreshold: 0.5  // 降低控制流扁平化强度
};

// 需要混淆的 JS 文件
const filesToObfuscate = [
  'background/service-worker.js',
  'options/options.js',
  'options/storage.js',
  'options/i18n.js',
  'popup/popup.js'
];

// 创建输出目录
const distDir = path.join(__dirname, 'dist');
if (!fs.existsSync(distDir)) {
  fs.mkdirSync(distDir, { recursive: true });
}

// 复制静态资源
function copyStaticFiles() {
  const staticDirs = ['assets', 'options', 'popup', 'background'];
  
  staticDirs.forEach(dir => {
    const srcDir = path.join(__dirname, dir);
    const destDir = path.join(distDir, dir);
    
    if (fs.existsSync(srcDir)) {
      copyDirectory(srcDir, destDir);
    }
  });
  
  // 复制 manifest.json
  fs.copyFileSync(
    path.join(__dirname, 'manifest.json'),
    path.join(distDir, 'manifest.json')
  );
  
  console.log('✅ 静态资源复制完成');
}

function copyDirectory(src, dest) {
  if (!fs.existsSync(dest)) {
    fs.mkdirSync(dest, { recursive: true });
  }
  
  const entries = fs.readdirSync(src, { withFileTypes: true });
  
  for (const entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);
    
    if (entry.isDirectory()) {
      copyDirectory(srcPath, destPath);
    } else if (!entry.name.endsWith('.js')) {
      // 不复制原始 JS 文件，将由混淆后的文件替代
      fs.copyFileSync(srcPath, destPath);
    }
  }
}
// 混淆 JavaScript 文件
function obfuscateFiles() {
  filesToObfuscate.forEach(file => {
    const inputPath = path.join(__dirname, file);
    const outputPath = path.join(distDir, file);
    
    if (fs.existsSync(inputPath)) {
      const code = fs.readFileSync(inputPath, 'utf8');
      
      // 根据文件类型选择配置：Service Worker 使用特殊配置
      const config = file.includes('service-worker')
        ? serviceWorkerConfig
        : obfuscationConfig;
      
      const obfuscationResult = JavaScriptObfuscator.obfuscate(code, config);
      
      // 确保输出目录存在
      const outputDir = path.dirname(outputPath);
      if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
      }
      
      fs.writeFileSync(outputPath, obfuscationResult.getObfuscatedCode());
      console.log(`🔒 已混淆: ${file}`);
    } else {
      console.warn(`⚠️ 文件不存在: ${file}`);
    }
  });
}

// 主流程
console.log('🚀 开始打包混淆...\n');
copyStaticFiles();
obfuscateFiles();
console.log('\n✅ 打包完成！混淆后的插件在 dist/ 目录中');
console.log('📦 可以将 dist/ 目录打包为 .zip 分发给他人使用');
