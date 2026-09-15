# /p/ — 프로필 페이지 구조

각 스트리머 프로필은 `/p/<아이디>/` 하위에 독립적으로 배치됩니다.

```
/p/
├── _template/          ← 복사해서 쓰는 원본 (직접 수정 X)
│   ├── index.html      ← 프로필 랜딩
│   ├── schedule/       ← 스케줄 캘린더
│   ├── song/           ← 노래책
│   ├── work/           ← 업보
│   ├── bgm/            ← BGM
│   ├── form/           ← 신청 폼
│   ├── overlay/        ← OBS 오버레이
│   ├── admin/          ← 관리자
│   └── assets/         ← 프로필별 이미지 (profile.jpg 등)
└── <아이디>/            ← _template 복사본
```

## 새 프로필 추가

```bash
cp -r p/_template p/<아이디>
```

복사 후 `p/<아이디>/` 안에서 아래 플레이스홀더를 치환합니다.

| 플레이스홀더 | 내용 | 예시 |
|---|---|---|
| `{{NAME}}` | 한글 이름 | 뮤서아 |
| `{{NAME_EN}}` | 영문/로고 표기 | MUSEA |
| `{{PREFIX}}` | Supabase 테이블 접두사 | musea |
| `{{CATCHPHRASE}}` | 이름 위 한 줄 소개 | 노래하고 춤추는 방구석 뮤지션 |
| `{{BIO_LINE_1}}` / `{{BIO_LINE_2}}` | 태그라인 2줄 | — |

일괄 치환 예시:

```bash
cd p/<아이디>
grep -rl '{{NAME}}' . | xargs sed -i 's/{{NAME}}/뮤서아/g'
grep -rl '{{NAME_EN}}' . | xargs sed -i 's/{{NAME_EN}}/MUSEA/g'
grep -rl '{{PREFIX}}' . | xargs sed -i 's/{{PREFIX}}/musea/g'
```

그 외 직접 채울 것:
- 프로필 그리드 값 (생일 / 국적 / MBTI / 데뷔 / 방송 / 컨텐츠) — 현재 `-`
- 로드맵 항목 — 현재 `목표 1` ~ `목표 10`
- 외부 링크 (`href="#"`) — SOOP / 트위터 / 유튜브 / 노래책
- `assets/profile.jpg` — 권장 **564 × 740px** (레티나 1128 × 1480px)

## 공유 리소스 (사이트 루트)

프로필 간 공통으로 쓰며 절대경로로 참조합니다.

- `/js/supabase-config.js` — Supabase URL / anon key
- `/assets/common.css` — 공통 스타일
- `/assets/favicon.svg` — 파비콘

## Supabase

프로필마다 테이블 접두사를 분리합니다 (`musea_schedules`, `<prefix>_schedules` …).
필요 테이블 목록은 각 페이지의 `from('...')` 호출을 참고하세요.
