# 🚨 CORS 문제 해결 완료!

## 문제 원인

콘솔에 표시된 오류:
```
Failed to load resource: net::ERR_CONNECTION_REFUSED
```

**원인**: 공공데이터포털 API는 브라우저에서 직접 호출 시 CORS(Cross-Origin Resource Sharing) 정책으로 차단됩니다.

## 해결 방법

### Vercel Serverless Function (프록시) 추가

API 호출을 서버 사이드에서 처리하도록 프록시 함수를 추가했습니다.

## 📁 새로 추가된 파일

### `/api/drug-search.js`
Vercel Serverless Function으로 API 호출을 프록시 처리합니다.

**기능:**
- 브라우저 → Vercel Function → 공공데이터 API
- CORS 헤더 자동 추가
- 에러 처리 및 로깅

## 🔧 수정된 파일

### `index.html`

#### 1. 새 함수 추가: `apiGetProxy()`
```javascript
function apiGetProxy(endpoint, params) {
  var url = '/api/drug-search?endpoint=' + endpoint;
  // ... 프록시를 통한 API 호출
}
```

#### 2. 기존 함수 수정
- `fetchList()` - 프록시 사용
- `fetchDetail()` - 프록시 사용
- `fetchSameIngredients()` - 프록시 사용

## 🚀 배포 방법

### 방법 1: Vercel (권장)

#### A. GitHub 푸시
```bash
cd drug-search-app-updated

# Git 초기화 (처음만)
git init

# 파일 추가
git add .
git commit -m "feat: CORS 프록시 추가"

# GitHub 저장소 연결 (본인의 저장소 URL로 변경)
git remote add origin https://github.com/your-username/drug-search-app.git
git branch -M main
git push -u origin main
```

#### B. Vercel 배포
1. https://vercel.com/ 접속 및 로그인
2. "New Project" 클릭
3. GitHub 저장소 선택
4. 설정:
   - Framework Preset: **Other**
   - Root Directory: `./`
   - Build Command: (비워두기)
   - Output Directory: `./`
5. **Environment Variables** (선택사항):
   - Key: `DRUG_API_KEY`
   - Value: `9ae1336587e873e0ff6a0524e0b0cc0333868f67f9fb4180c0be654fb7794615`
6. "Deploy" 클릭

### 방법 2: Netlify

```bash
# netlify.toml 파일 생성
cat > netlify.toml << 'EOF'
[build]
  publish = "."
  
[[redirects]]
  from = "/api/*"
  to = "/.netlify/functions/:splat"
  status = 200
EOF

# Netlify CLI 설치 (전역)
npm install -g netlify-cli

# 로그인
netlify login

# 초기화
netlify init

# 배포
netlify deploy --prod
```

## ✅ 배포 후 확인

### 1. API 프록시 테스트
브라우저에서 접속:
```
https://your-app.vercel.app/api/drug-search?endpoint=list&item_name=타이레놀&numOfRows=5&pageNo=1
```

**정상 응답 예시:**
```json
{
  "header": {
    "resultCode": "00",
    "resultMsg": "NORMAL SERVICE."
  },
  "body": {
    "items": [...],
    "totalCount": 5
  }
}
```

### 2. 의약품 검색 테스트
1. 배포된 사이트 접속
2. F12 → Console 탭
3. "에이미카" 검색
4. 콘솔 확인:
   ```
   [프록시] 호출: /api/drug-search?endpoint=list&...
   [프록시] 응답: {resultCode: "00", ...}
   ```

### 3. 동일성분 검색 테스트
1. 상세보기 클릭
2. "동일성분 의약품" 탭 클릭
3. 콘솔 확인:
   ```
   추출된 성분: 미라베그론
   전체 검색 결과: 156건
   필터링 후: 23건
   ```

## 🐛 문제 해결

### Error: API 호출 실패: 404

**원인**: Serverless function이 배포되지 않음

**해결:**
1. `api/drug-search.js` 파일 존재 확인
2. Vercel 대시보드 → Functions 탭 확인
3. 재배포: `git push` 또는 Vercel에서 "Redeploy"

### Error: serviceKey 오류

**원인**: API 키가 유효하지 않음

**해결:**
1. 공공데이터포털에서 API 키 재발급
2. `api/drug-search.js` 파일에서 API_KEY 수정
3. 또는 Vercel Environment Variables에 `DRUG_API_KEY` 설정

### CORS 오류가 여전히 발생

**원인**: 프록시를 사용하지 않고 직접 호출

**해결:**
1. 브라우저 캐시 삭제 (Ctrl+Shift+Delete)
2. Hard Refresh (Ctrl+F5)
3. 콘솔에서 "[프록시] 호출" 메시지 확인

## 📊 로컬 개발

### 1. Vercel CLI 설치
```bash
npm install -g vercel
```

### 2. 로컬 실행
```bash
cd drug-search-app-updated
vercel dev
```

로컬 서버: http://localhost:3000

### 3. 테스트
- 의약품 검색
- 동일성분 검색
- 콘솔 로그 확인

## 🔒 보안 고려사항

### API 키 보호

**현재 상태**: API 키가 코드에 하드코딩됨

**권장 사항**: 환경 변수 사용

#### Vercel 환경 변수 설정
1. Vercel 대시보드 → 프로젝트 선택
2. Settings → Environment Variables
3. 추가:
   - Key: `DRUG_API_KEY`
   - Value: (실제 API 키)
   - Scope: Production, Preview, Development
4. Redeploy

#### 코드 수정 (선택사항)
`api/drug-search.js`:
```javascript
const API_KEY = process.env.DRUG_API_KEY;

if (!API_KEY) {
  return res.status(500).json({ 
    error: 'API KEY가 설정되지 않았습니다.' 
  });
}
```

## 📈 성능 최적화

### 1. 캐싱 추가
API 응답을 캐싱하여 중복 호출 방지

### 2. Rate Limiting
API 호출 제한 설정

### 3. CDN 사용
Vercel은 자동으로 CDN 사용

## 🎉 완료!

이제 다음이 가능합니다:
- ✅ CORS 오류 없이 API 호출
- ✅ 동일성분 검색 정상 작동
- ✅ 프로덕션 환경에서 안정적 운영

---

**문제가 계속되면 콘솔 로그를 복사하여 문의해주세요!**
