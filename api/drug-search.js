// api/drug-search.js - 의약품 검색 API 프록시

export default async function handler(req, res) {
  // CORS 헤더 설정
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const { 
    endpoint, 
    item_name, 
    item_seq, 
    numOfRows = '100', 
    pageNo = '1' 
  } = req.query;

  if (!endpoint) {
    return res.status(400).json({ error: 'endpoint가 필요합니다.' });
  }

  // API 키 (환경변수 또는 하드코딩)
  const API_KEY = process.env.DRUG_API_KEY;
  if (!API_KEY) return res.status(500).json({ error: 'DRUG_API_KEY 환경변수가 설정되지 않았습니다.' });
  const BASE_URL = 'https://apis.data.go.kr';

  // 엔드포인트 매핑
  const endpoints = {
    'list': '/1471000/DrugPrdtPrmsnInfoService07/getDrugPrdtPrmsnInq07',
    'detail': '/1471000/DrugPrdtPrmsnInfoService07/getDrugPrdtPrmsnDtlInq06',
    'dur': '/1471000/DURPrdlstInfoService03/getDURPrdlstInfoList03',
    'bio': '/1471000/MdcinGrnIdntfcInfoService03/getMdcinGrnIdntfcInfoList03',
    'ingredient': '/1471000/DURIrdntInfoService03/getDrugPrdtMcpnInq03',  // 성분정보
    'mcpn': '/1471000/DrugPrdtPrmsnInfoService07/getDrugPrdtMcpnDtlInq07',  // 주성분 상세
    'bundle': '/1471000/DrBundleInfoService02/getDrBundleList02'  // 묶음의약품(제네릭)
  };

  const apiEndpoint = endpoints[endpoint];
  if (!apiEndpoint) {
    return res.status(400).json({ error: '유효하지 않은 endpoint입니다.' });
  }

  // URL 구성
  let url = `${BASE_URL}${apiEndpoint}?serviceKey=${API_KEY}&type=json&numOfRows=${numOfRows}&pageNo=${pageNo}`;
  
  if (item_name) {
    url += `&item_name=${encodeURIComponent(item_name)}`;
  }
  if (item_seq) {
    url += `&item_seq=${item_seq}`;
  }

  console.log('[drug-search] 요청 URL:', url);

  try {
    // 식약처 API 무한 대기 방지 (9초 타임아웃 — Vercel 10초 제한 내)
    const ctrl = new AbortController();
    const tmo = setTimeout(() => ctrl.abort(), 9000);
    let response;
    try {
      response = await fetch(url, {
        headers: { 'User-Agent': 'Mozilla/5.0' },
        signal: ctrl.signal
      });
    } finally {
      clearTimeout(tmo);
    }

    const text = await response.text();

    try {
      const data = JSON.parse(text);
      // Vercel CDN(edge) 캐싱 — 의약품 데이터는 하루 1회 정도만 변경
      //   s-maxage=21600(6h): CDN이 6시간 캐시 → 인기 검색은 식약처 안 거치고 즉시
      //   stale-while-revalidate=86400(24h): 만료 후에도 옛 응답 즉시 주고 백그라운드 갱신
      const ok = data && data.header && (data.header.resultCode === '00' || data.header.resultCode === undefined);
      if (ok) {
        res.setHeader('Cache-Control', 's-maxage=21600, stale-while-revalidate=86400, max-age=3600');
        res.setHeader('CDN-Cache-Control', 's-maxage=21600, stale-while-revalidate=86400');
      } else {
        res.setHeader('Cache-Control', 's-maxage=60');
      }
      return res.status(200).json(data);
    } catch (parseError) {
      console.error('[drug-search] JSON 파싱 오류:', parseError);
      res.setHeader('Cache-Control', 'no-store');
      return res.status(200).json({
        raw: text,
        error: 'JSON 파싱 실패'
      });
    }
  } catch (error) {
    console.error('[drug-search] API 호출 오류:', error);
    return res.status(500).json({ 
      error: error.message,
      url: url.replace(API_KEY, 'HIDDEN') // API 키 숨김
    });
  }
}
