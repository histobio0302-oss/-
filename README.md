# 의약품 검색 앱 (동일성분 검색 기능 추가)

Firebase 인증과 **동일성분 검색 기능**을 갖춘 의약품 검색 애플리케이션입니다.

## 🎉 새로운 기능

### ✨ 동일성분 의약품 검색 (신규 추가!)

- 검색 결과에서 "📄 상세보기" 버튼 클릭
- "🧬 동일성분 의약품" 탭에서 같은 주성분을 포함한 다른 제품들 확인
- 제품명, 제조사, 포장규격 정보를 표로 정리하여 표시

![동일성분 검색 예시](이미지 참고)

## 주요 기능

- ✅ Firebase 인증 (회원가입/로그인/승인 시스템)
- ✅ 의약품 단건 검색 (DUR API 연동)
- ✅ 의약품 상세 정보 조회
- ✅ **동일성분 의약품 검색** (NEW!)
- ✅ 생동성 정보 표시
- ✅ 내 목록 관리 (로컬 저장)
- ✅ 엑셀 다운로드
- ✅ 회수/폐기 정보 조회
- ✅ 행정처분 정보 조회
- ✅ 비급여 가격 정보
- ✅ 반응형 디자인

## 설정 방법

### 1. Firebase 설정

1. [Firebase Console](https://console.firebase.google.com/)에서 프로젝트 생성
2. Authentication 활성화 (이메일/비밀번호 방식)
3. Firestore Database 생성
4. `index.html` 파일에서 Firebase 설정 업데이트:

```javascript
// 2478줄 근처
var FIREBASE_CONFIG = {
  apiKey:            "YOUR_API_KEY",
  authDomain:        "YOUR_PROJECT.firebaseapp.com",
  projectId:         "YOUR_PROJECT_ID",
  storageBucket:     "YOUR_PROJECT.firebasestorage.app",
  messagingSenderId: "YOUR_SENDER_ID",
  appId:             "YOUR_APP_ID",
  measurementId:     "YOUR_MEASUREMENT_ID"
};

// 관리자 이메일 설정
var ADMIN_EMAILS = ["admin@example.com"];
```

### 2. Firestore 규칙 설정

Firebase Console > Firestore Database > 규칙 탭에서:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId} {
      allow read, write: if request.auth != null;
    }
  }
}
```

### 3. 로컬 테스트

```bash
# Live Server 사용 (VS Code 확장)
# 또는
python -m http.server 8000

# 브라우저에서 http://localhost:8000 접속
```

## Vercel 배포

### 1. GitHub 저장소 생성

```bash
git init
git add .
git commit -m "feat: 동일성분 검색 기능 추가"
git branch -M main
git remote add origin https://github.com/your-username/drug-search-app.git
git push -u origin main
```

### 2. Vercel 배포

1. [Vercel](https://vercel.com/)에 로그인
2. "New Project" → GitHub 저장소 선택
3. Framework Preset: Other
4. Deploy 클릭

## 사용 방법

### 1. 회원가입 및 로그인

1. 앱 접속 시 로그인 화면 표시
2. "회원가입" 탭에서 정보 입력
3. 관리자 승인 대기 (ADMIN_EMAILS에 등록된 계정으로 로그인 시 즉시 승인)
4. 승인 후 로그인하여 앱 사용

### 2. 의약품 검색

1. "의약품 검색" 탭 선택
2. 의약품명 입력 후 검색
3. 검색 결과 카드에서:
   - 🔗 링크: 의약품안전나라 상세 페이지
   - **📄 상세보기**: 상세정보 및 동일성분 의약품 확인 (NEW!)
   - ＋ 목록에 추가: 내 목록에 저장

### 3. 동일성분 의약품 확인 (신규 기능!)

1. 검색 결과에서 "📄 상세보기" 버튼 클릭
2. 상세 모달이 열림 (2개 탭)
   - **📋 의약품 상세정보**: 제품의 모든 정보 표시
   - **🧬 동일성분 의약품**: 같은 주성분의 다른 제품 목록
3. "🧬 동일성분 의약품" 탭 클릭
4. 자동으로 동일 성분 검색 수행
5. 제품명, 제조사, 포장규격을 표로 확인

### 4. 내 목록 관리

1. 우측 하단 플로팅 버튼 클릭
2. 엑셀 다운로드 또는 전체 삭제 가능
3. 목록은 브라우저 로컬 스토리지에 저장

## 파일 구조

```
drug-search-app/
├── index.html          # 메인 HTML 파일 (앱 전체 코드 포함)
├── api/
│   └── biz.js          # 사업자번호 검색 API
├── vercel.json         # Vercel 배포 설정
└── README.md           # 프로젝트 문서
```

## 기술 스택

- **Frontend**: HTML5, CSS3, Vanilla JavaScript
- **Authentication**: Firebase Authentication
- **Database**: Firebase Firestore
- **API**: 
  - 식품의약품안전처 DUR API
  - 의약품안전나라 API
- **Deployment**: Vercel

## 주요 변경사항 (v2.0)

### 추가된 기능
- ✅ 상세보기 모달 (의약품 상세정보 + 동일성분 의약품)
- ✅ 탭 UI (정보 탭/동일성분 탭)
- ✅ 동일성분 검색 API 연동
- ✅ 동일성분 결과 테이블 렌더링
- ✅ 애니메이션 효과 추가

### 수정된 UI
- 검색 결과 카드에 "상세보기" 버튼 추가
- 모달 내 탭 네비게이션 구현
- 깔끔한 테이블 레이아웃으로 동일성분 표시

## API 정보

### DUR 품목 정보 API
- 제공: 식품의약품안전처
- 사용: 의약품 정보 조회
- 문서: https://www.data.go.kr/

## 문제 해결

### Firebase 인증 오류
- Firebase 콘솔에서 Authentication 활성화 확인
- 이메일/비밀번호 로그인 방식 활성화 확인
- firebaseConfig 설정 확인

### 동일성분 검색이 작동하지 않는 경우
- 브라우저 콘솔에서 에러 메시지 확인
- API 호출이 정상적으로 이루어지는지 확인
- 네트워크 탭에서 API 응답 확인

### Vercel 배포 오류
- vercel.json 파일 존재 확인
- GitHub 저장소 연결 확인
- Vercel 빌드 로그 확인

## 추가 개선 사항

- [ ] 동일성분 제품 상세 정보 비교 기능
- [ ] 가격 비교 기능
- [ ] 즐겨찾기 기능
- [ ] 검색 히스토리
- [ ] PWA 지원

## 라이선스

MIT License

## 연락처

문의사항이 있으시면 이슈를 등록해주세요.
