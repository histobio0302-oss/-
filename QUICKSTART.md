# 🚀 빠른 시작 가이드

## 5분 안에 시작하기

### 1단계: Firebase 프로젝트 생성 (2분)

1. https://console.firebase.google.com/ 접속
2. "프로젝트 추가" 클릭
3. 프로젝트 이름 입력: `drug-search-app`
4. Analytics 선택사항 → "프로젝트 만들기" 클릭

### 2단계: Firebase 설정 (2분)

#### A. 웹 앱 추가
1. Firebase 콘솔에서 웹 아이콘 `</>` 클릭
2. 앱 닉네임 입력: `drug-search-web`
3. 설정 코드 복사

#### B. Authentication 활성화
1. 왼쪽 메뉴 "Authentication" → "시작하기"
2. "이메일/비밀번호" 선택 → 활성화 → 저장

#### C. Firestore 생성
1. 왼쪽 메뉴 "Firestore Database" → "데이터베이스 만들기"
2. 프로덕션 모드 선택 → 위치 선택 → 만들기

### 3단계: 코드 설정 (1분)

1. `index.html` 파일 열기
2. 2478줄 근처의 Firebase 설정 부분 찾기:

```javascript
var FIREBASE_CONFIG = {
  apiKey:            "YOUR_API_KEY",
  authDomain:        "YOUR_PROJECT.firebaseapp.com",
  projectId:         "YOUR_PROJECT_ID",
  // ... 나머지
};
```

3. Firebase 콘솔에서 복사한 설정으로 교체

4. 관리자 이메일 설정 (2489줄):

```javascript
var ADMIN_EMAILS = ["your-email@example.com"];
```

### 4단계: 로컬 테스트

```bash
# VS Code의 Live Server 사용
# 또는
python -m http.server 8000
```

브라우저에서 `http://localhost:8000` 접속

### 5단계: Vercel 배포 (선택사항)

```bash
# GitHub에 푸시
git init
git add .
git commit -m "Initial commit"
git push

# Vercel에서 Import
vercel.com → New Project → GitHub 저장소 선택 → Deploy
```

---

## 🎯 핵심 기능 테스트

### 1. 회원가입
- 이메일: test@example.com
- 비밀번호: test1234
- 이름: 테스트
- 소속: 테스트병원

### 2. 로그인 및 승인
- 관리자 이메일로 로그인 시 자동 승인
- 일반 사용자는 승인 대기 상태

### 3. 의약품 검색
- 검색어: `타이레놀`
- "검색" 버튼 클릭

### 4. 동일성분 검색 (신규 기능!)
- 검색 결과에서 "📄 상세보기" 클릭
- "🧬 동일성분 의약품" 탭 클릭
- 동일 성분 제품 목록 확인

---

## ❓ FAQ

### Q: Firebase 무료로 사용 가능한가요?
A: 네! Spark 플랜(무료)으로 충분히 사용 가능합니다.

### Q: API 키가 필요한가요?
A: Firebase만 설정하면 됩니다. DUR API는 공개 API입니다.

### Q: 모바일에서도 작동하나요?
A: 네! 반응형 디자인으로 모바일에서도 완벽히 작동합니다.

### Q: 동일성분 검색이 안 되는데요?
A: 
1. 브라우저 콘솔 확인 (F12)
2. 네트워크 탭에서 API 호출 확인
3. 주성분이 정확한지 확인

### Q: 배포 후 에러가 발생해요
A: 
1. Firebase 설정 확인
2. Authentication 활성화 확인
3. Firestore 규칙 확인

---

## 📞 지원

문제가 발생하면:
1. README.md의 "문제 해결" 섹션 확인
2. CHANGELOG.md에서 변경사항 확인
3. GitHub Issues에 문의

---

## 🎉 축하합니다!

설정이 완료되었습니다! 이제 의약품 검색과 동일성분 비교 기능을 사용해보세요.
