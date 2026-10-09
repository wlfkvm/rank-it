# 랭크잇 (RANK.IT)

대한민국 종합 랭킹 포털 **랭크잇**의 웹 프로젝트입니다.

## 서비스 방향
- 여행지: 대한민국 전국 TOP 500 + 지역 필터
- 맛집: 전국 TOP 500 + 지역/음식 종류
- 카페: 전국 TOP 500 + 지역/유형
- 게임: 플랫폼/장르별
- 도서: 월간 TOP 100 중심
- 음악: 월간/장르별

임의 데이터를 순위처럼 게시하지 않고, 데이터 출처와 산정 기준을 확정한 뒤 실제 랭킹을 공개하는 방향입니다.

## 기술 구조
- Hosting: Cloudflare Workers Static Assets
- Repository: GitHub
- Static root: `public/`
- Deploy: `npx wrangler deploy`
- Domain: `https://rank.it.kr`

## 링크 공유 미리보기
- 홈페이지와 7개 하위 페이지에 정적 Open Graph / X(Twitter) 카드 정보를 제공합니다.
- 실제 순위 공개 전에는 제목·설명에 준비 상태를 명시합니다.
- 공통 이미지: `public/assets/rankit-share-v1.png` (1200×630), 편집 원본: `design/rankit-share.svg`.
- 검증: `npm run check:social` (Node.js 18 이상, 추가 패키지 불필요).
- 적용 방법·페이지별 문구·검증 결과: [공유 메타태그 안내](docs/social-sharing.md).

## 다음 개발 우선순위
1. 여행지 후보 데이터와 TOP 500 산정 로직
2. 상세 페이지 URL/데이터 구조
3. 로그인·평가·월간 좋아요 시스템
4. D1 데이터베이스 연결
5. 순위 스냅샷 및 변동 기록
6. 검색·필터 고도화
