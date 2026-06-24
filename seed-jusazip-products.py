"""
seed-jusazip-products.py
주사집(JUSAZIP) 상품 엑셀 → public/jusazip-products.json 변환.

엑셀 컬럼(header=1):
  - goodsCd  : JUSAZIP 상품코드 (G로 시작, URL용)
  - goodsNm  : 상품명
  - vendorCd : "보험코드 654000881" 또는 "(보험코드)654000881" 형태,
               간혹 "M2094163" 같은 비보험코드도 섞임

생성 키:
  - bySeq[보험코드] = {g: 상품코드, n: 상품명}     # 1순위: ITEM_SEQ 직매핑
  - byName[공백제거 상품명] = {g, n}              # 2순위: 정규화 이름 완전일치
  - byBase[베이스 브랜드] = {g, n}                # 3순위: 주사제 베이스명 매칭

사용:
  py -3 seed-jusazip-products.py [입력.xlsx]
  (기본 입력: C:\\Users\\GB\\Downloads\\20260624_goods_info.xlsx)
"""
import sys
import re
import json
import os
from pathlib import Path
import pandas as pd

ROOT = Path(__file__).resolve().parent
DEFAULT_XLSX = Path(r"C:\Users\GB\Downloads\20260624_goods_info.xlsx")
OUT = ROOT / "public" / "jusazip-products.json"

COLS = [
    'seqn','goodsCd','goodsNm','category','seller','manufacturer','vendorCd',
    'keyword','origin','brand','model','spec','volume','tax','goodsCondition',
    'salesStatus','goodsStatus','stock','costPrice','salePrice','shipMethod',
    'shipFee','overseasShip','mainImg','extraImg','desc','optionUse',
    'optName','optValue','optStock','optMaxBuy'
]

EDI_RE = re.compile(r'(?:\(?\s*보험코드\s*\)?|EDI[\s:]*)\s*(\d{6,12})')

def parse_edi(vendor_cd):
    if not isinstance(vendor_cd, str): return None
    m = EDI_RE.search(vendor_cd)
    if m: return m.group(1)
    s = vendor_cd.strip()
    if s.isdigit() and 6 <= len(s) <= 12: return s
    return None

def norm_name(s):
    if not isinstance(s, str): return ''
    return re.sub(r'\s+', '', s)

def base_brand(s):
    if not isinstance(s, str): return ''
    s = s.strip()
    s = re.sub(r'^\([^)]*\)', '', s).strip()
    m = re.match(r'^([^\d\(\)_\[/]+)', s)
    if not m: return ''
    base = m.group(1).strip()
    return base if len(base) >= 3 else ''

def build(xlsx_path):
    df = pd.read_excel(xlsx_path, dtype=str, header=1)
    df.columns = COLS[:len(df.columns)]
    df = df.dropna(subset=['goodsCd','goodsNm'])

    by_seq, by_name, by_base = {}, {}, {}
    count = 0
    for _, r in df.iterrows():
        g = (r.get('goodsCd') or '').strip()
        n = (r.get('goodsNm') or '').strip()
        if not g or not n: continue
        if not g.startswith('G'): continue
        entry = {'g': g, 'n': n}
        count += 1
        edi = parse_edi(r.get('vendorCd'))
        if edi: by_seq[edi] = entry
        k = norm_name(n)
        if k: by_name[k] = entry
        base = base_brand(n)
        if base and base not in by_base: by_base[base] = entry

    OUT.parent.mkdir(parents=True, exist_ok=True)
    out = {
        'v': '20260624',
        'count': count,
        'bySeq': by_seq,
        'byName': by_name,
        'byBase': by_base
    }
    OUT.write_text(json.dumps(out, ensure_ascii=False), encoding='utf-8')
    print(f'[jusazip] 완료: 상품 {count} → bySeq {len(by_seq)} · byName {len(by_name)} · byBase {len(by_base)} → {OUT.relative_to(ROOT)}')

if __name__ == '__main__':
    xlsx = Path(sys.argv[1]) if len(sys.argv) > 1 else DEFAULT_XLSX
    if not xlsx.exists():
        print(f'엑셀 파일을 찾을 수 없음: {xlsx}', file=sys.stderr)
        sys.exit(1)
    build(xlsx)
