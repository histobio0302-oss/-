// api/gov-proxy.js
// 공공데이터포털(data.go.kr) 범용 프록시
// 경로: /api/gov/X/Y/Z?params → Vercel route rewrites to /api/gov-proxy?_path=X/Y/Z&params
// API 키는 서버 환경변수(DRUG_API_KEY)에서만 주입 — 클라이언트에 노출되지 않음

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  if (req.method === 'OPTIONS') return res.status(200).end();

  const KEY = process.env.DRUG_API_KEY;
  if (!KEY) return res.status(500).json({ error: 'DRUG_API_KEY 환경변수가 설정되지 않았습니다.' });

  // _path = '1471000/DrugPrdtPrmsnInfoService07/getDrugPrdtPrmsnInq07'
  const apiPath = req.query._path ? '/' + req.query._path : '/';

  // 나머지 쿼리 파라미터 복사 (_path, serviceKey, ServiceKey 제외)
  const params = { ...req.query };
  delete params._path;
  delete params.serviceKey;
  delete params.ServiceKey;

  const targetUrl = new URL('https://apis.data.go.kr' + apiPath);
  targetUrl.searchParams.set('serviceKey', KEY);
  Object.entries(params).forEach(([k, v]) => {
    if (Array.isArray(v)) v.forEach(val => targetUrl.searchParams.append(k, val));
    else targetUrl.searchParams.set(k, v);
  });

  try {
    const response = await fetch(targetUrl.toString(), {
      headers: { 'User-Agent': 'Mozilla/5.0', 'Accept': '*/*' }
    });
    const contentType = response.headers.get('content-type') || 'application/json';
    const text = await response.text();
    res.setHeader('Content-Type', contentType);
    // 정상 응답(2xx + resultCode 00)만 Vercel CDN 캐싱 (6h + 24h SWR, 브라우저 1h)
    if (response.status >= 200 && response.status < 300 && /resultCode["']?\s*:\s*["']?00/.test(text)) {
      res.setHeader('Cache-Control', 's-maxage=21600, stale-while-revalidate=86400, max-age=3600');
    } else {
      res.setHeader('Cache-Control', 's-maxage=60');
    }
    res.status(response.status).send(text);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
