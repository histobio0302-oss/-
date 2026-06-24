/* ══════════════════════════════════════════════════════════════
   build-price-changes.js
   price-timeline.json에서 (1) 최근 등재된 의약품 TOP 10
                       (2) 동일성분 묶음 안에서 최저가 의약품 TOP 10
                       (3) 상한가가 가장 낮은(가성비) 의약품 TOP 10
   → public/price-changes.json
   ── 대시보드 "이달의 약값 정보" 카드에서 사용
══════════════════════════════════════════════════════════════ */
const fs = require('fs');
const path = require('path');

const SRC = path.join(__dirname, 'public', 'price-timeline.json');
const OUT = path.join(__dirname, 'public', 'price-changes.json');

function ymd(s) { return s && s.length >= 10 ? s.slice(0,10) : (s || ''); }

function build() {
  if (!fs.existsSync(SRC)) {
    console.error('[price-changes] price-timeline.json 없음 — skip');
    return;
  }
  const raw = fs.readFileSync(SRC, 'utf8');
  const obj = JSON.parse(raw);
  const tl = obj.timeline || {};

  // 모든 품목의 최신 스냅샷을 평탄화
  const flat = [];
  for (const mdsCd of Object.keys(tl)) {
    const h = tl[mdsCd] && tl[mdsCd][0];
    if (!h) continue;
    const price = Number(h.price) || 0;
    if (price <= 0) continue;
    const nm = h.itmNm || '';
    if (!nm || nm.length < 3 || nm.length > 60) continue;
    flat.push({
      mdsCd,
      nm,
      ent: h.mnfEntpNm || '',
      gnl: h.gnlNmCd || '',
      price,
      date: ymd(h.date)
    });
  }

  // (1) 최신 등재일 기준 TOP 10 — 가장 최근 등재일을 기준으로 그 안에서 가격 다양하게
  const sortedByDate = flat.slice().sort((a, b) => (b.date || '').localeCompare(a.date || ''));
  const latestDate = sortedByDate.length ? sortedByDate[0].date : null;
  // 최신 등재일 그룹 중 가격 분포 다양하게 10개 (중복 제조사 제거 우선)
  const latestPool = sortedByDate.filter(r => r.date === latestDate);
  const seenEntForLatest = {};
  const latest = [];
  for (const r of latestPool) {
    if (latest.length >= 10) break;
    if (seenEntForLatest[r.ent]) continue;
    seenEntForLatest[r.ent] = 1;
    latest.push(r);
  }
  while (latest.length < 10 && latestPool.length > latest.length) {
    for (const r of latestPool) {
      if (latest.length >= 10) break;
      if (latest.indexOf(r) >= 0) continue;
      latest.push(r);
    }
    break;
  }

  // (2) 동일성분 묶음에서 최저가 의약품 TOP 10
  //   ⓐ gnlNmCd로 묶고 ⓑ 동일성분 안에 품목이 5개 이상 ⓒ 최저가 ÷ 평균가 비율이 가장 낮은 곳을 후보로
  const groups = {};
  for (const r of flat) {
    if (!r.gnl) continue;
    (groups[r.gnl] = groups[r.gnl] || []).push(r);
  }
  const valueRows = [];
  for (const gnl of Object.keys(groups)) {
    const arr = groups[gnl];
    if (arr.length < 5) continue;
    arr.sort((a, b) => a.price - b.price);
    const lo = arr[0];
    const sum = arr.reduce((s, x) => s + x.price, 0);
    const avg = sum / arr.length;
    if (avg <= 50) continue;
    const saveRatio = (1 - lo.price / avg) * 100;
    if (saveRatio < 20) continue;
    valueRows.push({
      mdsCd: lo.mdsCd,
      nm: lo.nm,
      ent: lo.ent,
      price: lo.price,
      avg: Math.round(avg),
      cheapest: lo.price,
      groupSize: arr.length,
      saveRatio: Math.round(saveRatio * 10) / 10,
      gnl
    });
  }
  valueRows.sort((a, b) => b.saveRatio - a.saveRatio);
  // 동일 제조사 중복 제거
  const seenEntForValue = {};
  const value = [];
  for (const r of valueRows) {
    if (value.length >= 10) break;
    if (seenEntForValue[r.ent]) continue;
    seenEntForValue[r.ent] = 1;
    value.push(r);
  }

  // (3) 약가 가장 낮은 가성비 TOP 10 (대중적 1일 1정 단가 100원 이하)
  const cheap = flat
    .filter(r => r.price > 0 && r.price <= 200)
    .sort((a, b) => a.price - b.price)
    .reduce((acc, r) => {
      if (acc.length >= 10) return acc;
      if (acc.some(x => x.ent === r.ent)) return acc;
      acc.push(r);
      return acc;
    }, []);

  const out = {
    v: 2,
    built: new Date().toISOString(),
    latestAdtDt: latestDate,
    counts: { totalItems: flat.length, gnlGroups: Object.keys(groups).length },
    latest,
    value,
    cheap
  };

  fs.writeFileSync(OUT, JSON.stringify(out));
  console.log(`[price-changes] 완료: ${flat.length}품목 분석 → 최신등재 ${latest.length}·동일성분가성비 ${value.length}·저가단가 ${cheap.length} (기준일 ${latestDate}) → ${path.relative(__dirname, OUT)}`);
}

module.exports = { build };

if (require.main === module) build();
