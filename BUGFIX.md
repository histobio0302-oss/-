# 🔧 동일성분 검색 기능 버그 수정

## 문제점

기존 코드에서 동일성분 검색 시 결과가 나오지 않는 문제가 있었습니다:
- **증상**: "동일성분 의약품이 없습니다" 메시지만 표시
- **원인**: 주성분 추출 방법이 부정확하고, 검색 로직이 제대로 작동하지 않음
- **예시**: 약학정보원에서는 28개 결과가 나오는데, 앱에서는 0건

## 수정 사항

### 1. 주성분 추출 로직 개선

**이전:**
```javascript
var mainIngr = currentDetailDrug.ingr.split('|')[0].split(',')[0].trim();
```

**수정 후:**
```javascript
// 괄호 안의 내용 우선 추출 (예: "에이미카시방정50밀리그램(미라베그론)" -> "미라베그론")
var parenMatch = ingr.match(/\(([^)]+)\)/);
if (parenMatch && parenMatch[1]) {
  mainIngr = parenMatch[1].trim();
} else {
  mainIngr = ingr.split('|')[0].split(',')[0].split('(')[0].trim();
}
```

### 2. 검색 결과 수 증가

**이전:**
```javascript
numOfRows=20  // 20개만 검색
```

**수정 후:**
```javascript
numOfRows=100  // 100개 검색하여 더 많은 결과 확보
```

### 3. 재검색 로직 추가

첫 번째 검색에서 결과가 없으면 성분명을 단축하여 재검색:
```javascript
if (items.length === 0) {
  var shortIngr = mainIngr.replace(/정$|염$|산$/, '').substring(0, 4);
  // 재검색 수행
}
```

### 4. 필터링 로직 개선

**이전:** 단순히 ITEM_SEQ만 비교

**수정 후:**
```javascript
// 제품명이나 주성분 정보에 검색 성분이 포함되어 있는지 확인
filtered = items.filter(function(item) {
  if (item.ITEM_SEQ === currentDetailDrug.seq) return false;
  
  var itemName = (item.ITEM_NAME || '').toLowerCase();
  var mainIngrLower = mainIngr.toLowerCase();
  
  return itemName.indexOf(mainIngrLower) >= 0 || 
         (item.MAIN_ITEM_INGR && item.MAIN_ITEM_INGR.toLowerCase().indexOf(mainIngrLower) >= 0);
});
```

### 5. UI 개선

- 검색된 주성분 표시
- 검색 결과 건수 강조
- 테이블 행 클릭 시 의약품안전나라 링크 연결
- 디버그 정보 콘솔 출력 (개발자 도구에서 확인 가능)

## 테스트 방법

### 1. 브라우저 개발자 도구 열기
- Chrome: F12 또는 Ctrl+Shift+I
- 콘솔(Console) 탭으로 이동

### 2. 의약품 검색
예시: "에이미카" 검색

### 3. 상세보기 클릭
- "📄 상세보기" 버튼 클릭

### 4. 동일성분 탭 클릭
- "🧬 동일성분 의약품" 탭 클릭

### 5. 콘솔에서 확인
```
검색할 주성분: 미라베그론
동일성분 결과: 28건
```

## 예상 결과

### 성공 사례
- **검색어**: 에이미카시방정50밀리그램
- **추출된 주성분**: 미라베그론
- **결과**: 28건의 동일성분 의약품 표시

### 실패 시 대처
1. 콘솔에서 오류 메시지 확인
2. API 호출이 정상인지 네트워크 탭에서 확인
3. 검색된 주성분이 올바른지 확인

## 추가 개선 사항

### 향후 업데이트 예정
- [ ] 성분 코드 기반 검색 (더 정확한 매칭)
- [ ] 캐싱 기능 (동일한 성분 재검색 방지)
- [ ] 페이지네이션 (결과가 많을 때)
- [ ] 정렬 기능 (제품명, 제조사별)

## 디버깅 가이드

### 콘솔 로그 확인
```javascript
검색할 주성분: [성분명]    // 추출된 주성분 확인
재검색: [단축명]           // 재검색 시도 시 표시
동일성분 결과: [N]건      // 최종 결과 건수
```

### API 응답 확인
1. 개발자 도구 → Network 탭
2. "getDrugPrdtPrmsnInq07" 필터
3. 응답(Response) 내용 확인

### 문제 해결
- **"동일성분 의약품을 찾을 수 없습니다"**: API 응답이 없거나 필터링 후 결과 없음
- **"동일성분 의약품이 없습니다"**: 필터링 후 현재 제품만 있음
- **오류 메시지**: API 호출 실패 또는 네트워크 문제

## 변경된 파일

- `index.html` (3083-3160줄): fetchSameIngredients 및 renderSameIngredients 함수 수정

## 배포 방법

1. 기존 파일 백업
2. 수정된 `index.html` 파일로 교체
3. 캐시 삭제 후 테스트
4. 정상 작동 확인 후 배포

---

**테스트 완료 후 정상 작동하는지 확인해주세요!**
