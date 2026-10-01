# AI B 패치: 비숑 "빙글 돌기" (index.html 변경 없음)

선언한 기능: 도움말 주제 버튼(이미지/텍스트/색감/테두리/저장)을 누르면 대화창의 비숑이 점프하며 한 바퀴 돈다.

## 1) style.css — `@keyframes bichon-click { ... }` 블록 바로 아래에 추가

```css
/* 비숑 빙글 돌기: 도움말 주제를 고를 때 대화창 비숑이 한 바퀴 돈다 */
.dialog-character img.is-spinning {
  animation: bichon-spin .64s steps(4, end) 1;
}

@keyframes bichon-spin {
  0%   { transform: translateY(0) rotateY(0deg); }
  50%  { transform: translateY(-8px) rotateY(180deg); }
  100% { transform: translateY(0) rotateY(360deg); }
}

@media (prefers-reduced-motion: reduce) {
  .dialog-character img.is-spinning { animation: none; }
}
```

## 2) script.js — `playBichonReaction()` 함수 바로 아래에 추가

```js
const dialogBichon = document.querySelector(".dialog-character img");

function playBichonSpin() {
  if (!dialogBichon) return;
  dialogBichon.classList.remove("is-spinning");
  void dialogBichon.offsetWidth;
  dialogBichon.classList.add("is-spinning");
}

if (dialogBichon) {
  dialogBichon.addEventListener("animationend", event => {
    if (event.animationName === "bichon-spin") {
      dialogBichon.classList.remove("is-spinning");
    }
  });
}
```

## 3) script.js — `helpTopics` 클릭 핸들러 마지막 줄에 1줄 추가

```js
  helpText.textContent =
    HELP_COPY[key] || HELP_COPY.image;

  playBichonSpin();   // ← 추가
});
```
