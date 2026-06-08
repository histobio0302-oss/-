// api/gov/[...path].js
// 공공데이터포털(data.go.kr) 범용 프록시 — API 키는 서버 환경변수에서만 주입
export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  if (req.method === 'OPTIONS') return res.status(200).end();

  const KEY = process.env.DRUG_API_KEY;
  if (!KEY) return res.status(500).json({ error: 'DRUG_API_KEY 환경변수가 설정되지 않았습니다.' });

  const parts = Array.isArray(req.query.path) ? req.query.path : [req.query.path];
  const apiPath = '/' + parts.join('/');

  const params = { ...req.query };
  delete params.path;
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
    res.status(response.status).send(text);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
