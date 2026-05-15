// Vercel 서버리스 프록시 — 심평원 약가기준정보 API (CORS 우회)
const KEY = '9ae1336587e873e0ff6a0524e0b0cc0333868f67f9fb4180c0be654fb7794615';

module.exports = async function (req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');

  if (req.method === 'OPTIONS') { res.status(200).end(); return; }

  const { itmNm } = req.query;
  if (!itmNm) { res.status(400).send('itmNm 파라미터가 필요합니다.'); return; }

  const upstream =
    'https://apis.data.go.kr/B551182/dgamtCrtrInfoService1.2/getDgamtList'
    + '?serviceKey=' + KEY
    + '&itmNm=' + encodeURIComponent(itmNm)
    + '&numOfRows=500&pageNo=1';

  try {
    const r    = await fetch(upstream);
    const text = await r.text();
    res.setHeader('Content-Type', 'text/xml; charset=utf-8');
    res.status(200).send(text);
  } catch (e) {
    res.status(502).send('upstream error: ' + e.message);
  }
};
