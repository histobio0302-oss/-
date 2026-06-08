# 📋 PROJECT_STATUS.md — 의약품 안전정보 포털

> 마지막 업데이트: 2026-05-15

---

## 1. 프로젝트 목적

식약처·심평원·공공데이터 포털 API를 통합한 **의약품 안전정보 검색 웹앱**.  
회원제 기반으로 운영되며, 약품 허가·성분·가격·회수·행정처분 정보를 한 화면에서 조회할 수 있다.

| 항목 | 내용 |
|------|------|
| 배포 URL | https://drug-search-app2.vercel.app |
| GitHub | https://github.com/cslis07/drug-search-app2 |
| Firebase 프로젝트 | `histobio-44f0f` |
| 관리자 계정 | cslis07@gmail.com |
| 로컬 경로 | `C:\Users\GB\Downloads\drug-search-app2-main\` |

---

## 2. 현재 구현된 기능

### 🔍 검색

| 기능 | 설명 |
|------|------|
| **제품명 검색** | 식약처 `getDrugPrdtPrmsnInq07` API — `item_name` 파라미터 |
| **성분명 검색** | 동일 API — `main_item_ingr` 파라미터 (토글 전환) |
| **최근 검색어** | localStorage 저장, 드롭다운 표시 |
| **검색 필터** | 제조사·제형·허가연도·가격 필터링 (클라이언트 사이드) |
| **카드/목록 뷰** | 그리드·리스트 토글, 결과 수 표시 |
| **엑셀 내보내기** | 검색 결과 `.xlsx` 다운로드 |
| **스켈레톤 로딩** | shimmer 애니메이션으로 검색 중 UX 개선 |

### 💊 약품 상세

| 기능 | 설명 |
|------|------|
| **의약품 상세보기** | PC: 우측 슬라이드 패널(680px) / 모바일: 풀스크린 |
| **동일성분 의약품 탭** | 같은 성분 의약품 목록 + 제형별 필터 + 정렬 |
| **약가변동 탭** | Firestore `drugPriceSnaps` → Chart.js 라인 차트, 최저/현재/최고가 통계 |
| **제네릭 목록보기** | 🔬 버튼 → 바텀시트, HIRA 가격 기준 정렬 |
| **낱알 이미지** | 식약처 낱알식별 API |

### 🗂 내 목록 / 즐겨찾기

| 기능 | 설명 |
|------|------|
| **즐겨찾기** | ⭐ 버튼, localStorage 저장 |
| **내 목록** | ＋ 버튼, 최대 10개, DUR 병용금기 자동 체크 |
| **약품 비교** | ⚖️ 최대 4개 선택 후 모달 비교 |
| **공유** | 📤 웹 공유 API / 클립보드 복사 |

### 🛡 안전정보 탭

| 기능 | 설명 |
|------|------|
| **회수·판매중지** | 식약처 `MdcinRtrvlSleStpgeInfoService04` — 제품명·업체명 검색, 상세 팝업 |
| **행정처분** | `MdcinExaathrService04` — 검색·최근처분, 상세 팝업 |
| **DUR 병용금기** | 병용금기·임부금기·노인주의·연령대금기·효능군중복 조회 |

### 📊 의약품 정보 탭

| 기능 | 설명 |
|------|------|
| **허가정보** | `getDrugPrdtPrmsnInq07` — 효능·효과·용법·용량 포함 |
| **건강지도** | 약국·병원 지도 |

### ⚙️ UI / 설정

| 기능 | 설명 |
|------|------|
| **다크모드** | 토글, localStorage 저장, system prefers-color-scheme 대응 |
| **뷰 전환** | PC뷰 ↔ 모바일뷰 (자동 모드 제거됨) |
| **키보드 단축키** | `Ctrl+K` 검색 포커스, `Esc` 모달 닫기 |
| **회원 인증** | Firebase Auth 이메일/비밀번호, 관리자 승인제 |

---

## 3. 수정한 주요 파일

```
drug-search-app2-main/
├── index.html                ← 모든 HTML·CSS·JS가 담긴 단일 SPA (약 6,500+ 줄)
├── api/
│   └── hira-dgamt.js         ← Vercel 서버리스 — 심평원 약가기준정보 CORS 프록시
├── vercel.json               ← Vercel 라우팅 (SPA fallback + API 리라이트)
├── package.json              ← 빈 파일 ({}) — 빌드 없음
└── scripts/
    ├── upload-name-mapping.js  ← 약품명→HIRA 코드 Firestore 업로드 스크립트
    ├── lookup-all.js           ← 엑셀 파일 전수 검사 유틸
    └── serviceAccountKey.json  ← Firebase Admin SDK 키 (Git 제외, 로컬 전용)
```

### index.html 주요 구조

```
<style>   CSS 토큰, 레이아웃, 모달, 다크모드, 반응형
<body>    헤더 → 탭 네비게이션 → 탭 콘텐츠들 → 모달들
<script>  PRICE_DB(내장 가격 DB) → API 함수 → 렌더링 → UI 이벤트
```

### Firestore 컬렉션

| 컬렉션 | 용도 |
|--------|------|
| `users/{uid}` | 회원 status (pending/approved/rejected) |
| `drugPriceSnaps/{seq}` | 약가 변동 이력 배열 |
| `drugMapping/nameIndex_1` | 약품명→HIRA 코드 매핑 (전반부) |
| `drugMapping/nameIndex_2` | 약품명→HIRA 코드 매핑 (후반부) |

---

## 4. 남은 작업

### 🔥 우선순위 높음

| 작업 | 설명 |
|------|------|
| **DUR 즐겨찾기 상호작용 경고** | 즐겨찾기 약품 간 병용금기 자동 체크 — `DURPrdlstInfoService03/getDurPrdlstInq02` |
| **제네릭 가격 비교 차트** | 동일성분 약품들의 가격 막대그래프 비교 |
| **오리지널 약품 표시** | 제네릭 목록에서 오리지널 강조 |

### 💡 중간 우선순위

| 작업 | 설명 |
|------|------|
| 약품 메모 | 즐겨찾기 항목에 개인 메모 추가 |
| 결과 정렬 | 가격순·이름순·최신순 정렬 버튼 |
| 약가 알림 | 즐겨찾기 약품 가격 변동 시 푸시 알림 |
| 회수 알림 | 즐겨찾기 약품 회수 발생 시 알림 |

### 🔮 장기 과제

| 작업 | 설명 |
|------|------|
| 바코드 스캔 | 카메라로 약 포장 바코드 → 자동 검색 |
| 처방전 OCR | 처방전 사진 → 약품 목록 자동화 |
| 복약 일정 | 내 목록 약품에 복약 시간 설정 |
| PDF 출력 | 상세정보 PDF 저장 |

---

## 5. 실행 명령어

### 로컬 개발

```bash
# 빌드 없음 — index.html을 브라우저로 직접 열기
# CORS 문제로 API 호출은 로컬에서 제한됨 (폴백 모드로 동작)

# 또는 로컬 서버 사용 (Python)
python -m http.server 3000

# Vercel CLI로 로컬 실행 (API 포함, 권장)
npx vercel dev
```

### 배포

```bash
# 변경 후 GitHub push → Vercel 자동 배포
git add index.html
git commit -m "설명"
git push origin master:main --force
# ⚠️ 반드시 --force 필요 (원격과 히스토리 불일치)
```

### Firestore 약품명 매핑 업로드

```bash
cd scripts
npm install
node upload-name-mapping.js --dry-run   # 실제 업로드 없이 미리보기
node upload-name-mapping.js             # Firestore에 실제 업로드
# serviceAccountKey.json이 scripts/ 폴더에 있어야 함
```

---

## 6. 배포 관련 주의사항

### ⚠️ 반드시 `--force` push

로컬 브랜치(`master`)와 원격(`main`)의 커밋 히스토리가 다르기 때문에 일반 push가 거부됨.

```bash
git push origin master:main --force   # 항상 이렇게
```

### ⚠️ serviceAccountKey.json Git 제외

`scripts/serviceAccountKey.json`은 Firebase Admin SDK 비밀키.  
`.gitignore`에 등록되어 있으나 커밋되지 않도록 항상 주의.

### ⚠️ API 키 노출

`index.html` 내에 식약처 공공데이터 API 키(`KEY`)가 하드코딩되어 있음.  
공공데이터 API는 허용 도메인 설정이 없어 노출돼도 서비스 기능에 영향 없음.  
단, Firebase 설정은 도메인 제한으로 보호됨.

### ⚠️ Firestore 1MB 문서 제한

약품명 매핑은 `nameIndex_1`, `nameIndex_2` 두 문서로 분할 저장.  
업로드 시 `upload-name-mapping.js`가 자동으로 분할 처리함.

### ⚠️ Vercel 서버리스 API (`api/hira-dgamt.js`)

심평원 CORS 우회용. `vercel.json`의 rewrite 규칙으로 라우팅됨.  
별도 `drug-search` 프록시는 Vercel 환경변수 또는 별도 파일로 관리 필요.

---

## 7. 최근 발생한 에러와 해결 방법

### ❌ git init 실수로 원격 연결 끊김

**증상**: 다운로드 폴더에서 `git init`을 실행해 로컬 히스토리가 사라짐.  
**해결**:
```bash
git remote add origin https://github.com/cslis07/drug-search-app2.git
git fetch origin
git checkout origin/main -- .     # 원격 파일 복원
# 이후 변경사항 재적용 후 force push
```

---

### ❌ 상세보기 탭(동일성분/약가변동)이 클릭해도 동작 안 함

**원인**: PC에서 `_openPcSidebar()`가 `.sheet` DOM을 `cloneNode(true)`로 복사해  
`#detailIngredientsContent` 등 ID가 중복됨. `switchDetailTab()` 등이  
`getElementById()`로 원본을 찾지만 원본은 숨겨져 있어 렌더링 안 됨.

**해결**: DOM 클론 방식 완전 제거. `openDetailModal()`이 항상 원본  
`#detailModal`을 열고, CSS만으로 PC 우측 패널 레이아웃 구현.

```css
/* PC: 우측 슬라이드 패널 */
@media (min-width: 641px) {
  #detailModal { justify-content: flex-end; align-items: stretch; }
  #detailModal .sheet {
    border-radius: 20px 0 0 20px;
    max-height: 100vh; height: 100vh;
    max-width: 680px; width: 100%;
    animation: slideInRight .25s cubic-bezier(.4,0,.2,1);
  }
}
```

---

### ❌ PC에서 카드 액션 버튼 7개가 한 줄에 몰려 레이아웃 깨짐

**원인**: 버튼 2단 레이아웃(`order:1`/`order:2`)이 `@media (max-width: 600px)`  
안에만 있어 PC 너비에서는 적용 안 됨.

**해결**: `order`, `flex` 속성을 전역 CSS로 이동.

```css
/* 1행 (주요) */
.detail-btn, .generic-btn {
  flex: 0 1 calc(50% - 4px); order: 1;
}
/* 2행 (보조) */
.fav-btn, .cmp-btn, .share-btn, .add-btn, .link-btn {
  flex: 1; order: 2;
}
```

---

### ❌ 회수·행정처분 상세 클릭 시 스크롤만 되고 내용 보기 불편

**원인**: 인라인 패널(`#recallDetail`, `#adminDetail`)이 테이블 아래 펼쳐지는 구조.

**해결**: 중앙 팝업 모달(`#safetyDetailPopup`)로 교체.  
`openSafetyPopup(html)` / `closeSafetyPopup()` 공유 함수로 통일.  
Esc 키, 배경 클릭으로 닫힘.

---

### ❌ 뷰 모드 '자동' 상태가 버튼에 표시됨

**원인**: `toggleViewMode()`가 none(자동) → mobile → pc → none(자동) 순환.

**해결**: `pc-forced` ↔ `mobile-forced`만 순환하도록 수정.  
저장된 상태 없을 때 `pc-forced`를 기본값으로 설정.

---

### ❌ 약가변동 차트 HIRA 코드 매핑 실패

**원인**: 식약처 ITEM_SEQ ≠ 심평원 HIRA 코드. 코드 체계가 다름.

**해결**: `scripts/upload-name-mapping.js`로 엑셀 파일(약제급여목록표)에서  
약품명→HIRA 코드 매핑을 추출해 Firestore `drugMapping/nameIndex_1,2`에 저장.  
앱 로드 시 두 문서를 병합해 `_nameMap`에 캐싱 후 차트 조회에 활용.

---

*이 파일은 Claude Code가 자동 생성했습니다.*
