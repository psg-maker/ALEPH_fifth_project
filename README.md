# Pixel Image Studio V2

기존 `psg_week1_third`의 SNS 이미지 제작기를 기반으로 UI/UX와 편집 기능을 확장한 V2입니다.

## V2 목표

- 기존 이미지 업로드 / 텍스트 / 비율 / 템플릿 / JSON / 다운로드 기능 유지
- 8비트 RPG 스타일의 좌·중앙·우 편집 UI 적용
- 텍스트를 캔버스에서 직접 드래그하고 크기 조절
- 밝기 / 대비 / 채도 / 블러 보정
- 심플 / 더블 / RPG 골드 테두리
- PNG / JPG 저장
- 8비트 비숑 도움말 캐릭터 및 기능 설명 대화창
- 향후 자연어 AI 이미지 편집 API를 연결할 수 있는 UX 자리 확보

현재 버전은 외부 AI API를 사용하지 않습니다. 비숑 캐릭터는 `이미지 / 텍스트 / 색감 / 테두리 / 저장` 기능을 안내하는 도움말 캐릭터로 동작합니다.

## 실행

정적 HTML 프로젝트이므로 `index.html`을 브라우저에서 열거나 정적 서버로 실행합니다.

```bash
python -m http.server 8000
```

그 후 브라우저에서 `http://localhost:8000`을 엽니다.

## 고정 검사

과제 5의 AI A/B 비교를 위해 `FIXED_TESTS.md`의 T05-C01 ~ T05-C10을 고정 검사로 사용합니다.
AI A 결과는 `AI_A_TEST_RESULTS.md`에 기록했습니다.

## AI A 이후 남길 작업

AI B는 저장된 소스와 `HANDOFF_AI_A.md`만 전달받아 새 대화에서 이어서 작업합니다.
추천 후속 기능은 **비숑 모션 고도화**입니다.

- 현재: CSS 기반 가벼운 idle bounce + 클릭 반응
- 후속 후보: 제자리 걷기 / 빙글 돌기 / 짖기 / 왕뼈 / 식사 시퀀스 중 하나

고정 검사 10개는 수정하지 않습니다.

## Future Work

만들다 보니 단순 과제보다 실제로 배포해보고 싶은 프로젝트가 되었습니다.
현재는 API 비용 때문에 생성형 AI 이미지 편집 기능까지 연결하지 않았지만, 추후 여유가 생기면 비숑 대화창을 자연어 편집 명령과 연결해 완성형으로 발전시키고 싶습니다.

## Open-source / reference

- NES.css — https://github.com/nostalgic-css/NES.css
  - 8-bit UI component CSS, MIT License
  - 프로젝트에서는 CDN 링크를 포함하고 자체 CSS fallback을 함께 사용합니다.
- RPGUI — https://github.com/RonenNess/RPGUI
  - old-school RPG GUI 디자인 방향 참고, zlib License
  - 본 V2의 RPG 프레임은 프로젝트 요구에 맞춰 새로 작성했습니다.

비숑 캐릭터 시안은 이 프로젝트 기획 과정에서 생성한 8비트 캐릭터 보드에서 기본 흰 비숑을 추출해 사용했습니다.
