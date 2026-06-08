// build.js — Vercel 빌드 시 JS 난독화 (CDN 스크립트 제외, 인라인만)
const fs = require('fs');
const JavaScriptObfuscator = require('javascript-obfuscator');

const html = fs.readFileSync('index.html', 'utf8');
let blockCount = 0, errorCount = 0;

const result = html.replace(
  /<script(?![^>]*\bsrc\b)[^>]*>([\s\S]*?)<\/script>/gi,
  (match, scriptContent) => {
    const trimmed = scriptContent.trim();
    if (!trimmed) return match;
    try {
      const obfuscated = JavaScriptObfuscator.obfuscate(trimmed, {
        compact: true,
        controlFlowFlattening: false,
        deadCodeInjection: false,
        debugProtection: false,
        disableConsoleOutput: false,
        identifierNamesGenerator: 'hexadecimal',
        rotateStringArray: true,
        selfDefending: false,
        stringArray: true,
        stringArrayEncoding: ['base64'],
        stringArrayThreshold: 0.8,
        splitStrings: false,
        unicodeEscapeSequence: false
      });
      blockCount++;
      return '<script>' + obfuscated.getObfuscatedCode() + '</script>';
    } catch (e) {
      errorCount++;
      console.warn('[build] 난독화 실패 블록 ' + (blockCount + errorCount) + ':', e.message.slice(0, 80));
      return match;
    }
  }
);

fs.writeFileSync('index.html', result, 'utf8');
console.log('[build] 완료: ' + blockCount + '개 난독화, ' + errorCount + '개 원본 유지');
