// build.js — Vercel 배포 전 JS 난독화 빌드 스크립트
// CDN <script src="...">는 건드리지 않고, 인라인 <script> 블록만 난독화합니다.
// 결과물은 public/index.html 에 저장 (outputDirectory: "public")

const fs = require('fs');
const JavaScriptObfuscator = require('javascript-obfuscator');

const INPUT = 'index.html';
const OUTPUT_DIR = 'public';
const OUTPUT = OUTPUT_DIR + '/index.html';

// public/ 디렉토리 생성 (없으면)
if (!fs.existsSync(OUTPUT_DIR)) fs.mkdirSync(OUTPUT_DIR);

const html = fs.readFileSync(INPUT, 'utf8');

let blockCount = 0;
let errorCount = 0;

// 인라인 <script> 블록만 대상 (src= 속성 없는 것)
const result = html.replace(
  /<script(?![^>]*\bsrc\b)[^>]*>([\s\S]*?)<\/script>/gi,
  function(match, scriptContent) {
    const trimmed = scriptContent.trim();
    if (!trimmed) return match;
    // data-noobfuscate 속성이 있는 블록은 건너뜀
    if (match.includes('data-noobfuscate')) { return match; }
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
      console.warn('[build] 난독화 실패 (블록 ' + (blockCount + errorCount) + '):', e.message.slice(0, 100));
      return match;
    }
  }
);

fs.writeFileSync(OUTPUT, result, 'utf8');
console.log('[build] 완료: ' + blockCount + '개 블록 난독화, ' + errorCount + '개 블록 원본 유지 → ' + OUTPUT);
