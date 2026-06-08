// api/biz.js - bizno.net 프록시 함수
// 상호명 검색: gb 파라미터 없이 q만 사용

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  if (req.method === 'OPTIONS') return res.status(200).end();

  const { company } = req.query;
  if (!company) return res.status(400).json({ error: '병원명이 필요합니다.' });

  const BIZNO_KEY = 'IcbnGhSMGT9rEc5OKTzrlTBoIwdN';

  // 상호명 검색: gb 없이 q=검색어만 사용
  const url = 'https://bizno.net/api/fapi'
    + '?key=' + BIZNO_KEY
    + '&q=' + encodeURIComponent(company)
    + '&type=json'
    + '&pagecnt=1';

  console.log('[biz.js] URL:', url);

  try {
    const response = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0' } });
    const text = await response.text();
    console.log('[biz.js] 응답:', text.substring(0, 300));
    try {
      return res.status(200).json(JSON.parse(text));
    } catch {
      return res.status(200).json({ raw: text });
    }
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
