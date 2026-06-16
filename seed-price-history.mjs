// seed-price-history.mjs
//
// 심평원 약가기준정보 API (getDgamtList) 의 adtStaDd 필터로
// 2015-01-01 ~ 오늘까지 매월 1일에 약가가 적용된 모든 row 를 수집,
// {mdsCd: [{date, price, gnlNmCd, itmNm, chgBfMdsCd}]} 형태로 누적해
// public/price-timeline.json 으로 저장하는 batch 시드 스크립트.
//
// 사용법:
//   DRUG_API_KEY=<키> node seed-price-history.mjs
//
// 출력:
//   public/price-timeline.json  (몇 MB ~ 수십 MB 예상)
//
// 호출 횟수 추정:
//   - 매월 1일 + 매 분기 첫날 → 약 132~150 dates
//   - 한 date 당 적용 row 수가 보통 100~5000건 (특히 약가 일괄 고시일은 많음)
//   - numOfRows=1000 로 페이지네이션 → 대부분 1~5 페이지
//   - 합산 약 300~800 호출 → 일일 quota 10,000 내에서 여유롭게 끝남.

import fs from 'fs';
import path from 'path';

const KEY = process.env.DRUG_API_KEY;
if (!KEY) {
  console.error('❌ DRUG_API_KEY 환경변수가 필요합니다.');
  process.exit(1);
}

const BASE = 'https://apis.data.go.kr/B551182/dgamtCrtrInfoService1.2/getDgamtList';
const OUT  = path.join('public', 'price-timeline.json');

// ── 시드 대상 날짜 ──
// 매월 1일 + 매 분기 첫날(이미 매월 1일에 포함). 약가 일괄 고시는 보통 매년 11/1, 12/1, 1/1 등.
function generateDates(startYear = 2015, endYear = new Date().getFullYear()) {
  const dates = [];
  for (let y = startYear; y <= endYear; y++) {
    for (let m = 1; m <= 12; m++) {
      const mm = String(m).padStart(2, '0');
      dates.push(`${y}${mm}01`);
    }
  }
  return dates;
}

async function fetchPage(adtStaDd, pageNo) {
  const url = new URL(BASE);
  url.searchParams.set('serviceKey', KEY);
  url.searchParams.set('numOfRows', '1000');
  url.searchParams.set('pageNo', String(pageNo));
  url.searchParams.set('adtStaDd', adtStaDd);
  const r = await fetch(url.toString());
  const txt = await r.text();
  return parseXml(txt);
}

// 매우 단순한 XML → JSON 파서 (item 만 추출)
function parseXml(txt) {
  const items = [];
  const totalMatch = txt.match(/<totalCount>(\d+)<\/totalCount>/);
  const total = totalMatch ? parseInt(totalMatch[1], 10) : 0;
  const itemRe = /<item>([\s\S]*?)<\/item>/g;
  let m;
  while ((m = itemRe.exec(txt)) !== null) {
    const body = m[1];
    const fieldRe = /<(\w+)>([\s\S]*?)<\/\1>/g;
    const obj = {};
    let f;
    while ((f = fieldRe.exec(body)) !== null) {
      obj[f[1]] = f[2].trim();
    }
    items.push(obj);
  }
  return { items, total };
}

async function fetchAllForDate(adtStaDd) {
  const all = [];
  let page = 1;
  while (true) {
    const { items, total } = await fetchPage(adtStaDd, page);
    all.push(...items);
    if (all.length >= total || items.length === 0) break;
    page++;
    if (page > 50) break;  // safety
  }
  return all;
}

async function main() {
  const dates = generateDates(2015);
  console.log(`📅 ${dates.length} 날짜 처리 시작 (${dates[0]} ~ ${dates[dates.length-1]})`);

  // {mdsCd: [{date, price, gnlNmCd, itmNm, mnfEntpNm, chgBfMdsCd}]}
  const timeline = {};
  let totalRows = 0;
  let callCount = 0;

  for (let i = 0; i < dates.length; i++) {
    const d = dates[i];
    try {
      const rows = await fetchAllForDate(d);
      callCount += Math.ceil(rows.length / 1000) || 1;
      rows.forEach(r => {
        const code = r.mdsCd;
        if (!code) return;
        if (!timeline[code]) timeline[code] = [];
        timeline[code].push({
          date: r.adtStaDd ? `${r.adtStaDd.slice(0,4)}-${r.adtStaDd.slice(4,6)}-${r.adtStaDd.slice(6,8)}` : '',
          price: r.mxCprc ? parseInt(r.mxCprc, 10) : null,
          gnlNmCd: r.gnlNmCd || '',
          itmNm: r.itmNm || '',
          mnfEntpNm: r.mnfEntpNm || '',
          chgBfMdsCd: r.chgBfMdsCd || ''
        });
        totalRows++;
      });
      console.log(`  ${d}: ${rows.length} rows  (누적 ${totalRows}, 코드 ${Object.keys(timeline).length})`);
    } catch (e) {
      console.warn(`  ${d}: ❌ ${e.message}`);
    }
    // gentle pacing
    await new Promise(r => setTimeout(r, 120));
  }

  // 각 코드별로 date 오름차순 정렬
  Object.keys(timeline).forEach(code => {
    timeline[code].sort((a,b) => (a.date||'').localeCompare(b.date||''));
  });

  if (!fs.existsSync('public')) fs.mkdirSync('public');
  fs.writeFileSync(OUT, JSON.stringify({
    v: 1,
    src: 'data.go.kr B551182/dgamtCrtrInfoService1.2/getDgamtList',
    built: new Date().toISOString(),
    dateRange: [dates[0], dates[dates.length-1]],
    rows: totalRows,
    products: Object.keys(timeline).length,
    timeline
  }), 'utf8');

  const sz = (fs.statSync(OUT).size / 1024 / 1024).toFixed(2);
  console.log(`\n✅ 완료: ${OUT}`);
  console.log(`   API 호출 ${callCount}회 / 행 ${totalRows} / 제품 ${Object.keys(timeline).length} / ${sz} MB`);
}

main().catch(e => {
  console.error('Fatal:', e);
  process.exit(1);
});
