# AI A → AI B 인수인계 문서

## 1. 목표

기존 과제 3 SNS 이미지 제작기를 V2로 확장한다.
핵심 방향은 기존 기능 보존 + 8비트 RPG UI/UX + 기본 이미지 편집 + 비숑 도움말 캐릭터이다.

## 2. 현재 상태

AI A 구현 범위는 완료되었고 고정 검사 T05-C01 ~ T05-C10이 10/10 PASS 상태다.

구현된 주요 기능:
- PNG/JPEG 업로드
- 메인/보조 텍스트
- 폰트/굵기/색상/외곽선
- Canvas 텍스트 직접 drag + resize
- 1:1 / 4:5 / 9:16
- 밝기/대비/채도/블러
- 심플/더블/RPG 골드 테두리
- 템플릿 저장/수정/삭제/불러오기
- JSON 내보내기/가져오기
- PNG/JPG 저장
- 8비트 RPG UI
- 비숑 클릭 도움말
- 비숑 CSS idle bounce + click reaction

## 3. 실행 명령

```bash
python -m http.server 8000
```

브라우저:

```text
http://localhost:8000
```

정적 사이트이므로 별도의 npm install이나 build는 필요하지 않다.

## 4. 주요 파일

- `index.html` — 전체 좌/중앙/우 UI + 비숑 도움말 구조
- `style.css` — 8비트 RPG UI, 픽셀 슬라이더, 반응형, 캐릭터 CSS motion
- `script.js` — 기존 V1 로직 + 색감/테두리/drag-resize/도움말/저장 로직
- `FIXED_TESTS.md` — 절대 변경하지 않을 검사 10개
- `AI_A_TEST_RESULTS.md` — AI A 10/10 결과

## 5. 고정 검사

`FIXED_TESTS.md`의 T05-C01 ~ T05-C10을 그대로 사용한다.
삭제, 완화, 기대 결과 변경 금지.

## 6. 남은 작업 / AI B 권장 기능

**비숑 캐릭터 motion 1개를 더 완성하는 것을 권장한다.**

후보 중 하나만 선택:
- 제자리 걷기
- 빙글 돌기
- 한번 짖기
- 왕뼈를 물고 바라보기
- 사료 먹고 배 통통해지는 짧은 시퀀스

현재 고정 검사에는 motion 고도화를 넣지 않았으므로, AI B는 새 기능을 추가한 뒤 기존 10개 검사가 모두 그대로 통과하는지를 다시 확인한다.

## 7. 다음 행동

1. 새 대화에서 이 저장소/폴더와 이 문서만 읽는다.
2. 현재 기능을 먼저 실행해서 재현한다.
3. `FIXED_TESTS.md` 10개를 실행한다.
4. 위 motion 후보 중 기능 하나를 선언하고 구현한다.
5. 동일한 검사 10개를 다시 실행한다.
6. 작업 시간, 요청·호출 수, 오류 수를 기록한다.

## 8. 건드리지 말 것

- T05-C01 ~ C10의 검사 정의
- 기존 V1 템플릿/JSON 호환 로직
- 이미지 다운로드 시 선택 박스가 결과물에 들어가지 않는 처리
- API 유료 호출 추가 금지 (현재 과제 범위에서는 사용하지 않음)

## 9. 알려진 제한

- 현재 비숑은 CSS 기반 간단 motion만 있다. 프레임 애니메이션(sprite sequence)은 미구현이다.
- AI 자연어 편집은 API 비용 문제로 미구현이다. UI 컨셉만 Future Work로 남긴다.
- NES.css CDN이 없어도 자체 CSS fallback으로 핵심 UI는 동작하지만, 네트워크 연결 시 NES.css 스타일이 함께 로드된다.

## 10. 원본 기준

원본 저장소:
https://github.com/psg-maker/psg_week1_third

원본 실행:
https://psg-maker.github.io/psg_week1_third/
