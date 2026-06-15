// api/kakao-callback.js — 카카오 OAuth 콜백 핸들러
// KAKAO_REST_KEY (필수), KAKAO_CLIENT_SECRET (클라이언트 시크릿 사용 시) 환경변수 설정

module.exports = async function handler(req, res) {
  const { code, error, error_description } = req.query;

  if (error || !code) {
    console.log('[kakao-callback] no code / error:', { error, error_description, hasCode: !!code });
    return res.redirect('/?kakao=cancel');
  }

  // REST 키는 프론트엔드 authorize URL에 공개되는 값이므로 하드코딩(불일치 방지).
  // authorize에 쓰인 client_id와 token 교환의 client_id가 반드시 동일해야 함(KOE101 방지).
  const KAKAO_REST_KEY = '07891a1c45f988f6c45c1693d3a2a273';
  const KAKAO_CLIENT_SECRET = process.env.KAKAO_CLIENT_SECRET || '';

  const REDIRECT_URI = 'https://snowy-nine-21.vercel.app/api/kakao-callback';

  try {
    // 1. 인가 코드 → 액세스 토큰
    const tokenBody = {
      grant_type: 'authorization_code',
      client_id: KAKAO_REST_KEY,
      redirect_uri: REDIRECT_URI,
      code,
    };
    if (KAKAO_CLIENT_SECRET) tokenBody.client_secret = KAKAO_CLIENT_SECRET;

    const tokenRes = await fetch('https://kauth.kakao.com/oauth/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded;charset=utf-8' },
      body: new URLSearchParams(tokenBody).toString(),
    });

    const tokenData = await tokenRes.json();
    console.log('[kakao-callback] token status:', tokenRes.status, '| body:', JSON.stringify(tokenData));

    if (!tokenData.access_token) {
      // 실제 카카오 에러 코드를 URL로 노출 (진단용)
      const reason = tokenData.error_code || tokenData.error || 'token_fail';
      const desc = tokenData.error_description || '';
      return res.redirect('/?kakao=error&reason=' + encodeURIComponent(reason) + '&desc=' + encodeURIComponent(desc));
    }

    // 2. 사용자 프로필 조회
    const userRes = await fetch('https://kapi.kakao.com/v2/user/me', {
      headers: { Authorization: `Bearer ${tokenData.access_token}` },
    });

    const userData = await userRes.json();
    console.log('[kakao-callback] user status:', userRes.status, '| body:', JSON.stringify(userData));

    if (!userData.id) {
      const reason = userData.code || userData.msg || 'profile_fail';
      return res.redirect('/?kakao=error&reason=' + encodeURIComponent(String(reason)));
    }

    const profile = (userData.kakao_account && userData.kakao_account.profile) || {};
    const params = new URLSearchParams({
      kakao: 'ok',
      kn: profile.nickname || '카카오 사용자',
      ka: profile.thumbnail_image_url || '',
      ki: String(userData.id || ''),
    });
    res.redirect(`/?${params.toString()}`);
  } catch (e) {
    console.error('[kakao-callback] catch:', e.message);
    res.redirect('/?kakao=error&reason=' + encodeURIComponent('exception:' + e.message));
  }
};
