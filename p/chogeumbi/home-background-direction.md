# 메인 GFX 배경 — 2026-09-16

사용자가 표시한 별/타원 장식과 모눈 배경을 제거하고, 일본풍 GFX UI 참고의 색면·얇은 프레임·팬시 분위기를 독립된 생성 배경으로 반영했다. 참고 구도나 캐릭터는 복제하지 않았다.

- 배경: `assets/home-gfx-background-v1.png`
- 생성 방식: built-in image_gen
- 참고: 사용자 제공 `94c6b9b1c6a26c81f2b875778148c243.jpg`, `868bb88979aa1c0ec4760b87fef12754.jpg`, `447608e8bd4fc36af18573bb88443abf.jpg`
- 캐릭터/텍스트/버튼은 실제 HTML 요소이며 배경에 구워 넣지 않는다.
- 메인만 `home-gfx.css`로 스타일 적용. 인트로/다른 탭은 그대로 유지.
- 원본 main.png와 이전 생성 이미지 보존.
- Chrome 화면 검토, 940×1350, 390/600 너비, 470×675 iframe, 라우팅/행운 버튼/달력 회귀 확인. 콘솔 오류 없음.

## 최종 프롬프트

Create ONE beautiful background-only raster asset for an existing VTuber hero UI, landscape aspect ratio 840:648, high resolution. Three input images are MOOD references only for Japanese anime GFX profile-edit design: airy pastel color blocking, elegant white fine-line framing, softly rounded layered panels, editorial asymmetry and fanciful pop-art stationery. Do NOT reproduce any reference composition. NO character, NO portrait, NO photo, NO text, NO letters, NO fake readable UI, NO icons/buttons to click. The real character and real text/buttons will be layered in HTML. Design a coherent bespoke background with a large quiet open center-right for a green-haired character and clear low-detail upper-left for a title. Palette art direction: 55% delicate pale mint / pistachio, 25% warm ivory, 15% butter yellow, 5% restrained peach pink; small rich emerald framing accents only. Sophisticated flat pastel planes, an asymmetric ivory diagonal sweep across the lower edge, soft translucent mint rounded inset plane, a few fine white offset contour lines at margins, tiny tastefully integrated checker fragments at bottom left or far edge, subtle airbrushed depth and satin printing finish, clean contemporary cute editorial GFX atmosphere. Beautiful balanced palette, generous breathing room. Absolutely no scattered stars, no asterisk symbols, no giant oval orbit, no grid paper, no clover clipart, no sticker collage, no chrome 3D objects, no rainbow blobs, no heavy dark outlines. Background must feel like one thoughtfully art-directed fancy GFX composition rather than random floating decorations. Use references for nuance not copying. Fill entire canvas edge to edge.
