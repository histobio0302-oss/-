// api/clinic-openings.js
// 병의원 개원정보 — 심평원 hospInfoServicev2/getHospBasisList 활용
// 사용자가 시도를 선택하면 해당 시도(±시군구)에서 지정 월에 개설된 병의원만 반환
// 응답 필드의 estbDd (개설일자, YYYYMMDD) 를 월 단위로 필터

const ENDPOINT = 'https://apis.data.go.kr/B551182/hospInfoServicev2/getHospBasisList';

function pad2(n) { return String(n).padStart(2, '0'); }

// 종별코드 → 카테고리 그룹화 (의원/병원/한방/치과/기타)
function categorize(clCdNm) {
  const s = (clCdNm || '').trim();
  if (/한의원|한방병원/.test(s)) return '한방';
  if (/치과/.test(s))           return '치과';
  if (/보건/.test(s))           return '보건기관';
  if (/조산원/.test(s))         return '조산원';
  if (/의원/.test(s))           return '의원';
  if (/병원/.test(s))           return '병원';
  return '기타';
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Cache-Control', 'public, s-maxage=600, stale-while-revalidate=3600');
  if (req.method === 'OPTIONS') return res.status(200).end();

  const KEY = process.env.DRUG_API_KEY;
  if (!KEY) return res.status(500).json({ error: 'DRUG_API_KEY 환경변수가 설정되지 않았습니다.' });

  const month   = String(req.query.month  || '').trim();   // 'YYYY-MM'
  const sidoCd  = String(req.query.sidoCd || '').trim();
  const sgguCd  = String(req.query.sgguCd || '').trim();
  if (!/^\d{4}-\d{2}$/.test(month)) return res.status(400).json({ error: 'month=YYYY-MM 필수' });
  if (!sidoCd)                       return res.status(400).json({ error: 'sidoCd 필수 (시도 미선택)' });

  // 월 범위 (YYYYMMDD)
  const [yy, mm] = month.split('-').map(Number);
  const monStart = parseInt(`${yy}${pad2(mm)}01`, 10);
  const monEnd   = parseInt(`${yy}${pad2(mm)}31`, 10);

  // 시도 단독: ~20K건 → 최대 20페이지(numOfRows=1000) 병렬
  // 시도+시군구: ~1K건 → 1페이지면 충분
  const perPage = 1000;
  const params = new URLSearchParams({
    serviceKey: KEY,
    numOfRows: String(perPage),
    pageNo: '1',
    sidoCd,
    _type: 'json'
  });
  if (sgguCd) params.set('sgguCd', sgguCd);

  try {
    // 1) 첫 페이지로 totalCount 파악
    const firstRes = await fetch(`${ENDPOINT}?${params.toString()}`, {
      headers: { 'User-Agent': 'Mozilla/5.0', 'Accept': 'application/json' }
    });
    if (!firstRes.ok) return res.status(502).json({ error: `API ${firstRes.status}` });
    const firstJson = await firstRes.json();
    const body  = firstJson?.response?.body || {};
    const total = parseInt(body.totalCount || 0, 10);
    const firstItems = normalizeItems(body.items);

    let allItems = [...firstItems];

    // 2) 추가 페이지가 필요하면 병렬 호출
    if (total > perPage) {
      const pages = Math.min(Math.ceil(total / perPage), 30); // 안전상 최대 30페이지(=3만건)
      const tasks = [];
      for (let p = 2; p <= pages; p++) {
        const u = new URLSearchParams(params);
        u.set('pageNo', String(p));
        tasks.push(
          fetch(`${ENDPOINT}?${u.toString()}`, {
            headers: { 'User-Agent': 'Mozilla/5.0', 'Accept': 'application/json' }
          })
            .then(r => r.ok ? r.json() : null)
            .then(j => normalizeItems(j?.response?.body?.items))
            .catch(() => [])
        );
      }
      const results = await Promise.all(tasks);
      results.forEach(arr => { allItems = allItems.concat(arr); });
    }

    // 3) estbDd 월 단위 필터
    const filtered = allItems.filter(it => {
      const d = parseInt(String(it.estbDd || '').replace(/\D/g, ''), 10);
      return d >= monStart && d <= monEnd;
    });

    // 4) 카드 형태로 정규화
    const items = filtered.map(it => ({
      name:        it.yadmNm || '',
      category:    categorize(it.clCdNm),
      clCdNm:      it.clCdNm || '',
      region:      [it.sidoCdNm, it.sgguCdNm].filter(Boolean).join(' '),
      address:     it.addr || '',
      phone:       it.telno || '',
      openedAt:    formatDate(it.estbDd),
      openedRaw:   parseInt(String(it.estbDd || '').replace(/\D/g, ''), 10),
      ykiho:       it.ykiho || '',
      doctorTotal: it.drTotCnt != null ? Number(it.drTotCnt) : null,
      hospUrl:     it.hospUrl || ''
    })).sort((a, b) => b.openedRaw - a.openedRaw); // 최신순

    // 카테고리 카운트
    const summary = items.reduce((m, x) => { m[x.category] = (m[x.category] || 0) + 1; return m; }, {});

    res.status(200).json({
      month,
      sidoCd,
      sgguCd: sgguCd || null,
      totalScanned: allItems.length,
      count: items.length,
      summary,
      items
    });
  } catch (err) {
    res.status(500).json({ error: err.message || String(err) });
  }
}

function normalizeItems(itemsField) {
  if (!itemsField) return [];
  // items: { item: [...] | {...} } | [...] | ''
  if (Array.isArray(itemsField)) return itemsField;
  const raw = itemsField.item;
  if (!raw) return [];
  return Array.isArray(raw) ? raw : [raw];
}

function formatDate(d) {
  const s = String(d || '').replace(/\D/g, '');
  if (s.length !== 8) return '';
  return `${s.slice(0,4)}-${s.slice(4,6)}-${s.slice(6,8)}`;
}
