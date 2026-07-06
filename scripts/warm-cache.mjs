// scripts/warm-cache.mjs
// 인기 검색어 CDN 캐시 워밍 — 식약처 cold-miss(첫 검색 4~5초) 방지용.
//
// 동작: 아래 POPULAR 약품들을 실제 검색과 동일한 경로(list → bio → detail)로 한 번씩
//       호출한다. 호출 자체가 Vercel 엣지 캐시(s-maxage=6h)를 채우므로, 이후 실제
//       사용자는 식약처를 거치지 않고 엣지에서 즉시 응답을 받는다.
//
// 실행:
//   node scripts/warm-cache.mjs                 # 프로덕션(drug-portal.vercel.app) 워밍
//   WARM_BASE=https://...preview.vercel.app node scripts/warm-cache.mjs
//
// 캐시 TTL이 6h이므로 3h 간격(.github/workflows/warm-cache.yml)으로 돌리면 항상 따뜻하게 유지됨.

const BASE = (process.env.WARM_BASE || 'https://snowy-nine-21.vercel.app').replace(/\/$/, '');
// 동시성은 낮게 — 식약처 API가 동시 호출에 약해 과하면 타임아웃(9s)·throttle 발생.
const CONCURRENCY = Number(process.env.WARM_CONCURRENCY || 2);
const DETAIL_PER_TERM = Number(process.env.WARM_DETAIL_PER_TERM || 3); // 약품당 상세 워밍 개수

// 어르신 사용자가 자주 찾는 약 — 처방·OTC 혼합. 실사용 검색 로그 확보 시 교체/확장.
const POPULAR = [
  '타이레놀', '아스피린', '게보린', '부루펜', '판콜에이', '베아제', '훼스탈', '우루사',
  '아모잘탄', '노바스크', '리피토', '크레스토', '리바로', '트윈스타', '자누비아', '다이아벡스',
  '메트포르민', '글리메피리드', '아토르바스타틴', '암로디핀', '텔미사르탄', '로수바스타틴',
  '하루날', '플라빅스', '아담페린', '콜대원', '판피린', '인사돌', '이가탄', '센트룸',
  '임팩타민', '아로나민', '까스활명수', '백초시럽', '신신파스', '제일쿨파프', '대웅바이오',
  '라니티딘', '오메프라졸', '란스톤'
];

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function getJson(url) {
  const t0 = Date.now();
  try {
    const res = await fetch(url, { headers: { 'User-Agent': 'drug-portal-cache-warmer' } });
    const age = res.headers.get('age');
    const cc = res.headers.get('x-vercel-cache') || res.headers.get('cf-cache-status') || '';
    const ms = Date.now() - t0;
    let body = null;
    try { body = await res.json(); } catch { /* ignore */ }
    return { ok: res.ok, status: res.status, ms, age, cache: cc, body };
  } catch (e) {
    return { ok: false, status: 0, ms: Date.now() - t0, error: e.message, body: null };
  }
}

// 앱은 제품명 검색을 ingr-index(클라이언트 색인)로 해소하고, 실제 API 호출은
// detail(품목별 상세)·bio(생동성)뿐이다. 그래서 워머도 색인으로 seq를 뽑아
// detail+bio를 데운다(앱 트래픽과 동일한 캐시 키를 채움). list API는 폴백 전용이라 생략.
let _idx = null;
async function loadIndex() {
  if (_idx) return _idx;
  const r = await fetch(`${BASE}/ingr-index.json`, { headers: { 'User-Agent': 'drug-portal-cache-warmer' } });
  _idx = await r.json();
  return _idx;
}

// fetchListByName(index.html)과 동일한 관련도 랭킹으로 상위 seq 추출
function resolveSeqs(idx, name, n) {
  const s = idx.s || {};
  const ql = name.toLowerCase();
  const cap = n * 3;
  const exact = [], prefix = [], mid = [];
  for (const seq in s) {
    const r = s[seq];
    const nm = r[1] || '';
    if (!nm) continue;
    const p = nm.toLowerCase().indexOf(ql);
    if (p < 0) continue;
    if (p === 0) {
      if (nm.length === name.length) exact.push(seq);
      else if (prefix.length < cap) prefix.push(seq);
    } else if (mid.length < cap) {
      mid.push(seq);
    }
  }
  return exact.concat(prefix).concat(mid).slice(0, n);
}

async function warmTerm(name) {
  const idx = await loadIndex();
  const seqs = resolveSeqs(idx, name, DETAIL_PER_TERM);
  const enc = encodeURIComponent(name);
  // detail(상위 N개) + bio(검색어 기반) — 앱이 실제로 호출하는 느린 경로
  const bioP = getJson(`${BASE}/api/gov/1471000/MdcBioEqInfoService01/getMdcBioEqList01?item_name=${enc}&pageNo=1&numOfRows=100&type=json`);
  const detailPs = seqs.map((seq) =>
    getJson(`${BASE}/api/drug-search?endpoint=detail&item_seq=${seq}&numOfRows=1&pageNo=1`)
  );
  const [bio, ...details] = await Promise.all([bioP, ...detailPs]);

  const okD = details.filter((d) => d.ok).length;
  const maxMs = Math.max(bio.ms, ...details.map((d) => d.ms), 0);
  const flag = maxMs > 3000 ? '🐢' : '⚡';
  console.log(
    `${flag} ${name.padEnd(10)} seq=${seqs.length} detail ${okD}/${details.length} ` +
    `(max ${Math.max(...details.map((d) => d.ms), 0)}ms) | bio ${bio.ms}ms`
  );
  return { name, ok: okD > 0 || bio.ok, detailOk: okD, seqs: seqs.length };
}

async function run() {
  console.log(`[warm] BASE=${BASE} terms=${POPULAR.length} concurrency=${CONCURRENCY}`);
  const t0 = Date.now();
  const results = [];
  const queue = [...POPULAR];

  async function worker() {
    while (queue.length) {
      const term = queue.shift();
      results.push(await warmTerm(term));
    }
  }
  await Promise.all(Array.from({ length: CONCURRENCY }, worker));

  const ok = results.filter((r) => r.ok).length;
  const detailWarmed = results.reduce((s, r) => s + (r.detailOk || 0), 0);
  console.log(
    `\n[warm] 완료: ${ok}/${results.length} 약품 성공 · detail ${detailWarmed}건 워밍 · ` +
    `총 ${((Date.now() - t0) / 1000).toFixed(1)}s`
  );
  if (ok === 0) process.exit(1);
}

run().catch((e) => { console.error('[warm] 실패:', e); process.exit(1); });
