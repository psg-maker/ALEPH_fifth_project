const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");
const imageInput = document.getElementById("imageInput");
const imageLayerList = document.getElementById("imageLayerList");

const imageRotationInput =
  document.getElementById("imageRotationInput");

const imageRotationValue =
  document.getElementById("imageRotationValue");

const fitImageBtn =
  document.getElementById("fitImageBtn");

const bringForwardBtn =
  document.getElementById("bringForwardBtn");

const sendBackwardBtn =
  document.getElementById("sendBackwardBtn");

const deleteImageBtn =
  document.getElementById("deleteImageBtn");

const textInput = document.getElementById("textInput");
const subtextInput = document.getElementById("subtextInput");
const fontSizeInput = document.getElementById("fontSizeInput");
const fontSizeValue = document.getElementById("fontSizeValue");
const textRotationInput = document.getElementById("textRotationInput");
const textRotationValue = document.getElementById("textRotationValue");
const fontFamilyInput = document.getElementById("fontFamilyInput");
const fontWeightInput = document.getElementById("fontWeightInput");
const strokeColorInput = document.getElementById("strokeColorInput");
const strokeWidthInput = document.getElementById("strokeWidthInput");
const strokeWidthValue = document.getElementById("strokeWidthValue");
const colorInput = document.getElementById("colorInput");
const xInput = document.getElementById("xInput");
const yInput = document.getElementById("yInput");

const brightnessInput = document.getElementById("brightnessInput");
const contrastInput = document.getElementById("contrastInput");
const saturationInput = document.getElementById("saturationInput");
const blurInput = document.getElementById("blurInput");
const brightnessValue = document.getElementById("brightnessValue");
const contrastValue = document.getElementById("contrastValue");
const saturationValue = document.getElementById("saturationValue");
const blurValue = document.getElementById("blurValue");
const resetFiltersBtn = document.getElementById("resetFiltersBtn");

const borderStyleInput = document.getElementById("borderStyleInput");
const borderWidthInput = document.getElementById("borderWidthInput");
const borderWidthValue = document.getElementById("borderWidthValue");
const borderColorInput = document.getElementById("borderColorInput");

const statusElement = document.getElementById("status");
const canvasInfo = document.getElementById("canvasInfo");
const templateName = document.getElementById("templateName");
const templateSelect = document.getElementById("templateSelect");
const jsonInput = document.getElementById("jsonInput");
const downloadFormat = document.getElementById("downloadFormat");

const bichonButton = document.getElementById("bichonButton");
const helpDialog = document.getElementById("helpDialog");
const closeHelpBtn = document.getElementById("closeHelpBtn");
const helpText = document.getElementById("helpText");
const helpTopics = document.getElementById("helpTopics");

const RATIOS = {
  "1:1": [1080, 1080],
  "4:5": [1080, 1350],
  "9:16": [1080, 1920]
};

const STORAGE_KEY = "sns-card-templates-v2";

const DEFAULT_TEXTS = [
  {
    id: 1,
    content: "메인 제목",
    x: 50,
    y: 30,
    fontSize: 90,
    rotation: 0,
    color: "#ffffff",
    fontFamily: "'Noto Sans KR', sans-serif",
    fontWeight: "700",
    strokeColor: "#000000",
    strokeWidth: 4
  },
  {
    id: 2,
    content: "보조 문구",
    x: 50,
    y: 18,
    fontSize: 42,
    rotation: 0,
    color: "#fff4dc",
    fontFamily: "'Nanum Brush Script', cursive",
    fontWeight: "400",
    strokeColor: "#000000",
    strokeWidth: 0
  }
];

const DEFAULT_FILTERS = {
  brightness: 100,
  contrast: 100,
  saturation: 100,
  blur: 0
};

const DEFAULT_BORDER = {
  style: "none",
  width: 12,
  color: "#f4c66a"
};

let state = {
  images: [],
  ratio: "4:5",
  texts: DEFAULT_TEXTS.map(text => ({ ...text })),
  filters: { ...DEFAULT_FILTERS },
  border: { ...DEFAULT_BORDER }
};

let selectedTextId = 1;
let selectedTemplateId = null;
let selectedImageId = null;
let memoryTemplates = [];
let textBounds = new Map();
let pointerMode = null;
let pointerStart = null;

function cloneTexts(texts) {
  return texts.map(text => ({ ...text }));
}

function makeId() {
  if (globalThis.crypto && typeof globalThis.crypto.randomUUID === "function") {
    return globalThis.crypto.randomUUID();
  }
  return `tpl-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function getTextById(id) {
  return state.texts.find(text => text.id === id);
}

function getMainText() {
  return getTextById(1);
}

function getSubText() {
  return getTextById(2);
}

function getSelectedText() {
  return getTextById(selectedTextId) || getMainText();
}

function setStatus(message, error = false) {
  statusElement.textContent = message;
  statusElement.classList.toggle("error", error);
}

function normalizeFilters(filters = {}) {
  return {
    brightness: Number.isFinite(Number(filters.brightness)) ? Number(filters.brightness) : DEFAULT_FILTERS.brightness,
    contrast: Number.isFinite(Number(filters.contrast)) ? Number(filters.contrast) : DEFAULT_FILTERS.contrast,
    saturation: Number.isFinite(Number(filters.saturation)) ? Number(filters.saturation) : DEFAULT_FILTERS.saturation,
    blur: Number.isFinite(Number(filters.blur)) ? Number(filters.blur) : DEFAULT_FILTERS.blur
  };
}

function normalizeBorder(border = {}) {
  const styles = new Set(["none", "simple", "double", "rpg"]);
  return {
    style: styles.has(border.style) ? border.style : DEFAULT_BORDER.style,
    width: Number.isFinite(Number(border.width)) ? Number(border.width) : DEFAULT_BORDER.width,
    color: typeof border.color === "string" ? border.color : DEFAULT_BORDER.color
  };
}

function normalizeConfig(config) {
  if (!config || typeof config !== "object") {
    throw new Error("템플릿 설정값이 없습니다.");
  }

  if (Array.isArray(config.texts)) {
    return {
      ratio: RATIOS[config.ratio] ? config.ratio : "4:5",
      texts: cloneTexts(config.texts),
      filters: normalizeFilters(config.filters),
      border: normalizeBorder(config.border)
    };
  }

  // V1 단일 텍스트(flat) 템플릿 호환
  if (typeof config.text === "string") {
    const main = {
      ...DEFAULT_TEXTS[0],
      content: config.text,
      x: typeof config.x === "number" ? config.x : DEFAULT_TEXTS[0].x,
      y: typeof config.y === "number" ? config.y : DEFAULT_TEXTS[0].y,
      fontSize: typeof config.fontSize === "number" ? config.fontSize : DEFAULT_TEXTS[0].fontSize,
      color: typeof config.color === "string" ? config.color : DEFAULT_TEXTS[0].color,
      fontFamily: typeof config.fontFamily === "string" ? config.fontFamily : DEFAULT_TEXTS[0].fontFamily,
      fontWeight: typeof config.fontWeight === "string" ? config.fontWeight : DEFAULT_TEXTS[0].fontWeight,
      strokeColor: typeof config.strokeColor === "string" ? config.strokeColor : DEFAULT_TEXTS[0].strokeColor,
      strokeWidth: typeof config.strokeWidth === "number" ? config.strokeWidth : DEFAULT_TEXTS[0].strokeWidth
    };

    return {
      ratio: RATIOS[config.ratio] ? config.ratio : "4:5",
      texts: [main, { ...DEFAULT_TEXTS[1] }],
      filters: { ...DEFAULT_FILTERS },
      border: { ...DEFAULT_BORDER }
    };
  }

  throw new Error("지원하지 않는 템플릿 형식입니다.");
}

function buildFilterString() {
  const f = state.filters;
  return `brightness(${f.brightness}%) contrast(${f.contrast}%) saturate(${f.saturation}%) blur(${f.blur}px)`;
}

function getSelectedImageLayer() {
  return state.images.find(
    layer => layer.id === selectedImageId
  );
}

function selectImageLayer(id) {
  selectedImageId = id;
  selectedTextId = null;

  syncImageControls();
  renderImageLayerList();
  drawCanvas();
}

function syncImageControls() {
  const layer = getSelectedImageLayer();

  if (!layer) {
    imageRotationInput.value = 0;
    imageRotationValue.textContent = "0°";
    return;
  }

  imageRotationInput.value = Math.round(layer.rotation);
  imageRotationValue.textContent =
    `${Math.round(layer.rotation)}°`;

  updateRangeFill(imageRotationInput);
}

function fitLayerToCanvas(layer) {
  if (!layer) return;

  const scale = Math.max(
    canvas.width / layer.image.width,
    canvas.height / layer.image.height
  );

  layer.width = layer.image.width * scale;
  layer.height = layer.image.height * scale;

  layer.x = canvas.width / 2;
  layer.y = canvas.height / 2;

  layer.rotation = 0;
}

function createImageLayer(image, fileName, isFirst = false) {
  const layer = {
    id: makeId(),
    name: fileName,
    image,
    x: canvas.width / 2,
    y: canvas.height / 2,
    width: image.width,
    height: image.height,
    rotation: 0
  };

  if (isFirst) {
    fitLayerToCanvas(layer);
  } else {
    const scale = Math.min(
      (canvas.width * 0.45) / image.width,
      (canvas.height * 0.45) / image.height
    );

    layer.width = image.width * scale;
    layer.height = image.height * scale;
  }

  return layer;
}

function drawImageLayers(width, height) {

  if (state.images.length === 0) {
    ctx.save();

    ctx.fillStyle = "#eeeeee";
    ctx.fillRect(0, 0, width, height);

    ctx.fillStyle = "#555555";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";

    ctx.font =
      "700 40px 'Noto Sans KR', sans-serif";

    ctx.fillText(
      "이미지를 불러오세요",
      width / 2,
      height / 2
    );

    ctx.restore();

    return;
  }

  state.images.forEach(layer => {

    ctx.save();

    ctx.translate(layer.x, layer.y);

    ctx.rotate(
      layer.rotation * Math.PI / 180
    );

    ctx.filter = buildFilterString();

    ctx.drawImage(
      layer.image,
      -layer.width / 2,
      -layer.height / 2,
      layer.width,
      layer.height
    );

    ctx.restore();
  });

  const selected =
    getSelectedImageLayer();

  if (selected) {
    drawImageSelection(selected);
  }
}

function drawImageSelection(layer) {

  const handleSize = 32;
  const rotateDistance = 75;

  ctx.save();

  ctx.translate(layer.x, layer.y);

  ctx.rotate(
    layer.rotation * Math.PI / 180
  );

  ctx.strokeStyle = "#111111";
  ctx.lineWidth = 4;

  ctx.setLineDash([12, 8]);

  ctx.strokeRect(
    -layer.width / 2,
    -layer.height / 2,
    layer.width,
    layer.height
  );

  ctx.setLineDash([]);

  /* 크기 조절 핸들 */

  ctx.fillStyle = "#ffffff";

  ctx.fillRect(
    layer.width / 2 - handleSize / 2,
    layer.height / 2 - handleSize / 2,
    handleSize,
    handleSize
  );

  ctx.strokeRect(
    layer.width / 2 - handleSize / 2,
    layer.height / 2 - handleSize / 2,
    handleSize,
    handleSize
  );

  /* 회전선 */

  ctx.beginPath();

  ctx.moveTo(
    0,
    -layer.height / 2
  );

  ctx.lineTo(
    0,
    -layer.height / 2 - rotateDistance
  );

  ctx.stroke();

  /* 회전 핸들 */

  ctx.beginPath();

  ctx.arc(
    0,
    -layer.height / 2 - rotateDistance,
    18,
    0,
    Math.PI * 2
  );

  ctx.fillStyle = "#ffffff";
  ctx.fill();

  ctx.stroke();

  ctx.restore();
}

function measureTextLayer(textLayer, width, height) {
  ctx.save();
  ctx.font = `${textLayer.fontWeight} ${textLayer.fontSize}px ${textLayer.fontFamily}`;
  const lines = textLayer.content.split("\n");
  const lineHeight = textLayer.fontSize * 1.15;
  const maxLineWidth = Math.max(1, ...lines.map(line => ctx.measureText(line || " ").width));
  ctx.restore();

  const centerX = width * (textLayer.x / 100);
  const topY = height * (textLayer.y / 100);
  const padding = Math.max(14, textLayer.strokeWidth + 8);
  const boxWidth = maxLineWidth + padding * 2;
  const boxHeight = lines.length * lineHeight + padding * 2;

  return {
    x: centerX - boxWidth / 2,
    y: topY - padding,
    width: boxWidth,
    height: boxHeight,
    centerX,
    topY,
    handleSize: Math.max(18, Math.min(34, textLayer.fontSize * 0.28))
  };
}

function drawTextLayer(textLayer, width, height) {
  const bounds = measureTextLayer(textLayer, width, height);
  const centerX = bounds.x + bounds.width / 2;
  const centerY = bounds.y + bounds.height / 2;
  const rotation = Number(textLayer.rotation) || 0;
  const textY = height * (textLayer.y / 100);

  ctx.save();
  ctx.translate(centerX, centerY);
  ctx.rotate(rotation * Math.PI / 180);
  ctx.textAlign = "center";
  ctx.textBaseline = "top";
  ctx.fillStyle = textLayer.color;
  ctx.strokeStyle = textLayer.strokeColor;
  ctx.lineWidth = textLayer.strokeWidth;
  ctx.lineJoin = "round";
  ctx.shadowColor = "rgba(0, 0, 0, 0.45)";
  ctx.shadowBlur = 10;
  ctx.font = `${textLayer.fontWeight} ${textLayer.fontSize}px ${textLayer.fontFamily}`;

  const lines = textLayer.content.split("\n");
  const lineHeight = textLayer.fontSize * 1.15;

  lines.forEach((line, index) => {
    const localY = textY + lineHeight * index - centerY;

    if (textLayer.strokeWidth > 0) {
      ctx.strokeText(line, 0, localY);
    }

    ctx.fillText(line, 0, localY);
  });

  ctx.restore();

  bounds.rotation = rotation;
  textBounds.set(textLayer.id, bounds);

  if (textLayer.id === selectedTextId) {
    drawSelection(bounds, rotation);
  }
}

function drawSelection(bounds, rotation = 0) {
  const { width, height, handleSize } = bounds;
  const centerX = bounds.x + width / 2;
  const centerY = bounds.y + height / 2;
  const rotateDistance = 70;

  ctx.save();
  ctx.translate(centerX, centerY);
  ctx.rotate(rotation * Math.PI / 180);
  ctx.shadowBlur = 0;

  // 선택 박스
  ctx.strokeStyle = "#ffe6a0";
  ctx.lineWidth = 8;
  ctx.setLineDash([14, 10]);
  ctx.strokeRect(-width / 2, -height / 2, width, height);

  ctx.strokeStyle = "#2d2944";
  ctx.lineWidth = 3;
  ctx.setLineDash([14, 10]);
  ctx.strokeRect(-width / 2, -height / 2, width, height);
  ctx.setLineDash([]);

  // 크기 조절 핸들
  ctx.fillStyle = "#f58ca5";
  ctx.fillRect(
    width / 2 - handleSize / 2,
    height / 2 - handleSize / 2,
    handleSize,
    handleSize
  );
  ctx.strokeStyle = "#2d2944";
  ctx.lineWidth = 3;
  ctx.strokeRect(
    width / 2 - handleSize / 2,
    height / 2 - handleSize / 2,
    handleSize,
    handleSize
  );

  // 회전 핸들 연결선
  ctx.beginPath();
  ctx.moveTo(0, -height / 2);
  ctx.lineTo(0, -height / 2 - rotateDistance);
  ctx.stroke();

  // 회전 핸들
  ctx.beginPath();
  ctx.arc(0, -height / 2 - rotateDistance, 18, 0, Math.PI * 2);
  ctx.fillStyle = "#ffffff";
  ctx.fill();
  ctx.stroke();

  ctx.restore();
}

function drawBorder(width, height) {
  const b = state.border;
  if (b.style === "none") return;

  const maxWidth = Math.min(80, Math.max(2, b.width));
  const inset = maxWidth / 2;

  ctx.save();
  ctx.shadowBlur = 0;
  ctx.lineJoin = "miter";

  if (b.style === "simple") {
    ctx.strokeStyle = b.color;
    ctx.lineWidth = maxWidth;
    ctx.strokeRect(inset, inset, width - maxWidth, height - maxWidth);
  } else if (b.style === "double") {
    ctx.strokeStyle = "#2d2944";
    ctx.lineWidth = maxWidth;
    ctx.strokeRect(inset, inset, width - maxWidth, height - maxWidth);
    const inner = maxWidth * 1.5;
    ctx.strokeStyle = b.color;
    ctx.lineWidth = Math.max(3, maxWidth * 0.38);
    ctx.strokeRect(inner, inner, width - inner * 2, height - inner * 2);
  } else if (b.style === "rpg") {
    ctx.strokeStyle = "#2d2944";
    ctx.lineWidth = maxWidth;
    ctx.strokeRect(inset, inset, width - maxWidth, height - maxWidth);

    const goldInset = maxWidth * 0.9;
    ctx.strokeStyle = b.color;
    ctx.lineWidth = Math.max(4, maxWidth * 0.42);
    ctx.strokeRect(goldInset, goldInset, width - goldInset * 2, height - goldInset * 2);

    const shineInset = maxWidth * 1.25;
    ctx.strokeStyle = "#ffe4a4";
    ctx.lineWidth = Math.max(2, maxWidth * 0.16);
    ctx.strokeRect(shineInset, shineInset, width - shineInset * 2, height - shineInset * 2);

    // RPG-style corner gems
    const gem = Math.max(8, maxWidth * 0.55);
    const centers = [
      [goldInset, goldInset],
      [width - goldInset, goldInset],
      [goldInset, height - goldInset],
      [width - goldInset, height - goldInset]
    ];
    ctx.fillStyle = b.color;
    ctx.strokeStyle = "#2d2944";
    ctx.lineWidth = Math.max(2, gem * 0.18);
    centers.forEach(([cx, cy]) => {
      ctx.fillRect(cx - gem / 2, cy - gem / 2, gem, gem);
      ctx.strokeRect(cx - gem / 2, cy - gem / 2, gem, gem);
    });
  }

  ctx.restore();
}

function drawCanvas() {
  const [width, height] = RATIOS[state.ratio];
  canvas.width = width;
  canvas.height = height;
  canvasInfo.textContent = `${width} × ${height}`;
  textBounds = new Map();

  ctx.clearRect(0, 0, width, height);
  drawImageLayers(width, height);

  state.texts.forEach(textLayer => drawTextLayer(textLayer, width, height));
  drawBorder(width, height);
}

function renderImageLayerList() {

  imageLayerList.innerHTML = "";

  if (state.images.length === 0) {
    const empty = document.createElement("p");

    empty.className = "mini-help";
    empty.textContent = "첨부된 이미지가 없습니다.";

    imageLayerList.appendChild(empty);

    return;
  }

  [...state.images]
    .reverse()
    .forEach(layer => {

      const item =
        document.createElement("div");

      item.className =
        "image-layer-item";

      if (layer.id === selectedImageId) {
        item.classList.add("active");
      }

      item.dataset.imageId = layer.id;

      const name =
        document.createElement("span");

      name.className =
        "image-layer-name";

      name.textContent =
        layer.name;

      const remove =
        document.createElement("button");

      remove.type = "button";

      remove.className =
        "image-layer-delete";

      remove.textContent = "×";

      remove.dataset.deleteImage =
        layer.id;

      item.appendChild(name);
      item.appendChild(remove);

      imageLayerList.appendChild(item);
    });
}

imageLayerList.addEventListener(
  "click",
  event => {

    const deleteButton =
      event.target.closest(
        "[data-delete-image]"
      );

    if (deleteButton) {

      const id =
        deleteButton.dataset.deleteImage;

      state.images =
        state.images.filter(
          layer => layer.id !== id
        );

      if (selectedImageId === id) {
        selectedImageId = null;
        syncImageControls();
      }

      renderImageLayerList();
      drawCanvas();

      return;
    }

    const item =
      event.target.closest(
        "[data-image-id]"
      );

    if (!item) return;

    selectImageLayer(
      item.dataset.imageId
    );
  }
);

function updateRangeFill(input) {
  const min = Number(input.min || 0);
  const max = Number(input.max || 100);
  const value = Number(input.value);
  const pct = ((value - min) / (max - min)) * 100;
  input.style.setProperty("--fill", `${pct}%`);
}

function updateAllRangeFills() {
  document.querySelectorAll('input[type="range"]').forEach(updateRangeFill);
}

function selectTextLayer(id) {
  selectedTextId = id;
  selectedImageId = null;
  renderImageLayerList();
  syncTextStyleControls();
  drawCanvas();
}

function syncTextStyleControls() {
  const target = getSelectedText();
  if (!target) return;

  fontSizeInput.value = target.fontSize;
  fontSizeValue.textContent = target.fontSize;
  if (textRotationInput) {
    textRotationInput.value = Number(target.rotation) || 0;
  }
  if (textRotationValue) {
    textRotationValue.textContent = `${Math.round(Number(target.rotation) || 0)}°`;
  }
  fontFamilyInput.value = target.fontFamily;
  fontWeightInput.value = target.fontWeight;
  strokeColorInput.value = target.strokeColor;
  strokeWidthInput.value = target.strokeWidth;
  strokeWidthValue.textContent = target.strokeWidth;
  colorInput.value = target.color;
  xInput.value = target.x;
  yInput.value = target.y;

  [fontSizeInput, textRotationInput, strokeWidthInput, xInput, yInput]
    .filter(Boolean)
    .forEach(updateRangeFill);
}

function syncFilterControls() {
  brightnessInput.value = state.filters.brightness;
  contrastInput.value = state.filters.contrast;
  saturationInput.value = state.filters.saturation;
  blurInput.value = state.filters.blur;
  brightnessValue.textContent = state.filters.brightness;
  contrastValue.textContent = state.filters.contrast;
  saturationValue.textContent = state.filters.saturation;
  blurValue.textContent = state.filters.blur;

  [brightnessInput, contrastInput, saturationInput, blurInput].forEach(updateRangeFill);
}

function syncBorderControls() {
  borderStyleInput.value = state.border.style;
  borderWidthInput.value = state.border.width;
  borderWidthValue.textContent = state.border.width;
  borderColorInput.value = state.border.color;
  updateRangeFill(borderWidthInput);
}

function syncControls() {
  const mainText = getMainText();
  const subText = getSubText();
  if (!mainText || !subText) return;

  textInput.value = mainText.content;
  subtextInput.value = subText.content;
  syncTextStyleControls();
  syncFilterControls();
  syncBorderControls();

  document.querySelectorAll("[data-ratio]").forEach(button => {
    const active = button.dataset.ratio === state.ratio;
    button.classList.toggle("active", active);
    button.classList.toggle("is-success", active);
  });
}

// -----------------------------
// 이미지 업로드
// -----------------------------
function loadImageFile(file) {

  return new Promise(
    (resolve, reject) => {

      const url =
        URL.createObjectURL(file);

      const image =
        new Image();

      image.onload = () => {
        URL.revokeObjectURL(url);

        resolve(image);
      };

      image.onerror = () => {
        URL.revokeObjectURL(url);

        reject(
          new Error(
            `${file.name} 파일을 읽을 수 없습니다.`
          )
        );
      };

      image.src = url;
    }
  );
}


imageInput.addEventListener(
  "change",
  async event => {

    const files =
      [...event.target.files];

    if (files.length === 0) return;

    const validTypes = [
      "image/png",
      "image/jpeg"
    ];

    for (const file of files) {

      if (
        !validTypes.includes(file.type)
      ) {
        setStatus(
          `${file.name}: PNG 또는 JPEG만 사용할 수 있습니다.`,
          true
        );

        continue;
      }

      try {

        const image =
          await loadImageFile(file);

        const isFirst =
          state.images.length === 0;

        const layer =
          createImageLayer(
            image,
            file.name,
            isFirst
          );

        state.images.push(layer);

        selectedImageId =
          layer.id;

      } catch (error) {

        setStatus(
          error.message,
          true
        );
      }
    }

    renderImageLayerList();
    syncImageControls();
    drawCanvas();

    setStatus(
      `이미지 ${files.length}개 불러오기 완료`
    );

    /* 같은 파일을 다시 선택할 수 있게 */
    imageInput.value = "";
  }
);

imageRotationInput.addEventListener(
  "input",
  () => {

    const layer =
      getSelectedImageLayer();

    if (!layer) return;

    layer.rotation =
      Number(
        imageRotationInput.value
      );

    imageRotationValue.textContent =
      `${layer.rotation}°`;

    updateRangeFill(
      imageRotationInput
    );

    drawCanvas();
  }
);

fitImageBtn.addEventListener(
  "click",
  () => {

    const layer =
      getSelectedImageLayer();

    if (!layer) {
      setStatus(
        "이미지를 선택하세요.",
        true
      );

      return;
    }

    fitLayerToCanvas(layer);

    syncImageControls();
    drawCanvas();

    setStatus(
      "선택한 이미지를 Canvas에 맞췄습니다."
    );
  }
);


deleteImageBtn.addEventListener(
  "click",
  () => {

    if (!selectedImageId) return;

    state.images =
      state.images.filter(
        layer =>
          layer.id !== selectedImageId
      );

    selectedImageId = null;

    syncImageControls();
    renderImageLayerList();
    drawCanvas();
    setStatus("선택한 이미지를 삭제했습니다.");
  }
);


bringForwardBtn.addEventListener(
  "click",
  () => {

    const index =
      state.images.findIndex(
        layer =>
          layer.id === selectedImageId
      );

    if (
      index < 0 ||
      index === state.images.length - 1
    ) return;

    [
      state.images[index],
      state.images[index + 1]
    ] = [
      state.images[index + 1],
      state.images[index]
    ];

    renderImageLayerList();
    drawCanvas();
  }
);

sendBackwardBtn.addEventListener(
  "click",
  () => {

    const index =
      state.images.findIndex(
        layer =>
          layer.id === selectedImageId
      );

    if (index <= 0) return;

    [
      state.images[index],
      state.images[index - 1]
    ] = [
      state.images[index - 1],
      state.images[index]
    ];

    renderImageLayerList();
    drawCanvas();
  }
);





// -----------------------------
// 텍스트 편집
// -----------------------------
textInput.addEventListener("focus", () => selectTextLayer(1));
subtextInput.addEventListener("focus", () => selectTextLayer(2));

textInput.addEventListener("input", () => {
  const mainText = getMainText();
  if (!mainText) return;
  selectedTextId = 1;
  mainText.content = textInput.value;
  drawCanvas();
});

subtextInput.addEventListener("input", () => {
  const subText = getSubText();
  if (!subText) return;
  selectedTextId = 2;
  subText.content = subtextInput.value;
  drawCanvas();
});

fontSizeInput.addEventListener("input", () => {
  const target = getSelectedText();
  if (!target) return;
  target.fontSize = Number(fontSizeInput.value);
  fontSizeValue.textContent = target.fontSize;
  updateRangeFill(fontSizeInput);
  drawCanvas();
});

if (textRotationInput) {
  textRotationInput.addEventListener("input", () => {
    const target = getSelectedText();
    if (!target) return;

    target.rotation = Number(textRotationInput.value);
    if (textRotationValue) {
      textRotationValue.textContent = `${target.rotation}°`;
    }
    updateRangeFill(textRotationInput);
    drawCanvas();
  });
}

fontFamilyInput.addEventListener("input", () => {
  const target = getSelectedText();
  if (!target) return;
  target.fontFamily = fontFamilyInput.value;
  drawCanvas();
});

fontWeightInput.addEventListener("input", () => {
  const target = getSelectedText();
  if (!target) return;
  target.fontWeight = fontWeightInput.value;
  drawCanvas();
});

strokeColorInput.addEventListener("input", () => {
  const target = getSelectedText();
  if (!target) return;
  target.strokeColor = strokeColorInput.value;
  drawCanvas();
});

strokeWidthInput.addEventListener("input", () => {
  const target = getSelectedText();
  if (!target) return;
  target.strokeWidth = Number(strokeWidthInput.value);
  strokeWidthValue.textContent = target.strokeWidth;
  updateRangeFill(strokeWidthInput);
  drawCanvas();
});

colorInput.addEventListener("input", () => {
  const target = getSelectedText();
  if (!target) return;
  target.color = colorInput.value;
  drawCanvas();
});

xInput.addEventListener("input", () => {
  const target = getSelectedText();
  if (!target) return;
  target.x = Number(xInput.value);
  updateRangeFill(xInput);
  drawCanvas();
});

yInput.addEventListener("input", () => {
  const target = getSelectedText();
  if (!target) return;
  target.y = Number(yInput.value);
  updateRangeFill(yInput);
  drawCanvas();
});



// -----------------------------
// 캔버스에서 텍스트 직접 이동 / 크기 조절
// -----------------------------
function canvasPoint(event) {
  const rect = canvas.getBoundingClientRect();
  return {
    x: (event.clientX - rect.left) * (canvas.width / rect.width),
    y: (event.clientY - rect.top) * (canvas.height / rect.height)
  };
}

function imageLocalPoint(point, layer) {

  const dx =
    point.x - layer.x;

  const dy =
    point.y - layer.y;

  const angle =
    -layer.rotation *
    Math.PI / 180;

  return {
    x:
      dx * Math.cos(angle) -
      dy * Math.sin(angle),

    y:
      dx * Math.sin(angle) +
      dy * Math.cos(angle)
  };
}


function pointInsideImage(
  point,
  layer
) {

  const local =
    imageLocalPoint(
      point,
      layer
    );

  return (
    local.x >=
      -layer.width / 2 &&

    local.x <=
      layer.width / 2 &&

    local.y >=
      -layer.height / 2 &&

    local.y <=
      layer.height / 2
  );
}


function pointOnImageResizeHandle(
  point,
  layer
) {

  const local =
    imageLocalPoint(
      point,
      layer
    );

  const size = 45;

  return (
    Math.abs(
      local.x -
      layer.width / 2
    ) < size &&

    Math.abs(
      local.y -
      layer.height / 2
    ) < size
  );
}


function pointOnImageRotateHandle(
  point,
  layer
) {

  const local =
    imageLocalPoint(
      point,
      layer
    );

  const rotateY =
    -layer.height / 2 - 75;

  return (
    Math.abs(local.x) < 40 &&
    Math.abs(
      local.y - rotateY
    ) < 40
  );
}

function pointInside(point, bounds) {
  return point.x >= bounds.x && point.x <= bounds.x + bounds.width && point.y >= bounds.y && point.y <= bounds.y + bounds.height;
}

function pointOnResizeHandle(point, bounds) {
  const hs = bounds.handleSize * 1.45;
  const cx = bounds.x + bounds.width;
  const cy = bounds.y + bounds.height;
  return Math.abs(point.x - cx) <= hs && Math.abs(point.y - cy) <= hs;
}

function textLocalPoint(point, bounds, rotation = 0) {
  const centerX = bounds.x + bounds.width / 2;
  const centerY = bounds.y + bounds.height / 2;
  const dx = point.x - centerX;
  const dy = point.y - centerY;
  const angle = -rotation * Math.PI / 180;

  return {
    x: dx * Math.cos(angle) - dy * Math.sin(angle),
    y: dx * Math.sin(angle) + dy * Math.cos(angle)
  };
}

function pointInsideText(point, bounds, rotation = 0) {
  const local = textLocalPoint(point, bounds, rotation);

  return (
    local.x >= -bounds.width / 2 &&
    local.x <= bounds.width / 2 &&
    local.y >= -bounds.height / 2 &&
    local.y <= bounds.height / 2
  );
}

function pointOnTextResizeHandle(point, bounds, rotation = 0) {
  const local = textLocalPoint(point, bounds, rotation);
  const size = bounds.handleSize * 1.6;

  return (
    Math.abs(local.x - bounds.width / 2) <= size &&
    Math.abs(local.y - bounds.height / 2) <= size
  );
}

function pointOnTextRotateHandle(point, bounds, rotation = 0) {
  const local = textLocalPoint(point, bounds, rotation);
  const rotateY = -bounds.height / 2 - 70;

  return (
    Math.abs(local.x) <= 40 &&
    Math.abs(local.y - rotateY) <= 40
  );
}

canvas.addEventListener(
  "pointerdown",
  event => {
    const point = canvasPoint(event);
    const selectedImage = getSelectedImageLayer();

    /* 이미지 회전 핸들 */
    if (
      selectedImage &&
      pointOnImageRotateHandle(point, selectedImage)
    ) {
      pointerMode = "image-rotate";
      pointerStart = {
        startAngle: Math.atan2(
          point.y - selectedImage.y,
          point.x - selectedImage.x
        ),
        rotation: selectedImage.rotation
      };

      canvas.setPointerCapture(event.pointerId);
      return;
    }

    /* 이미지 크기 조절 */
    if (
      selectedImage &&
      pointOnImageResizeHandle(point, selectedImage)
    ) {
      pointerMode = "image-resize";
      pointerStart = {
        width: selectedImage.width,
        height: selectedImage.height,
        distance: Math.hypot(
          point.x - selectedImage.x,
          point.y - selectedImage.y
        )
      };

      canvas.setPointerCapture(event.pointerId);
      return;
    }

    const selectedBounds = textBounds.get(selectedTextId);
    const selectedText = selectedTextId !== null ? getTextById(selectedTextId) : null;

    /* 텍스트 회전 핸들 */
    if (
      selectedBounds &&
      selectedText &&
      pointOnTextRotateHandle(
        point,
        selectedBounds,
        Number(selectedText.rotation) || 0
      )
    ) {
      const centerX = selectedBounds.x + selectedBounds.width / 2;
      const centerY = selectedBounds.y + selectedBounds.height / 2;

      pointerMode = "text-rotate";
      pointerStart = {
        startAngle: Math.atan2(
          point.y - centerY,
          point.x - centerX
        ),
        rotation: Number(selectedText.rotation) || 0,
        centerX,
        centerY
      };

      canvas.setPointerCapture(event.pointerId);
      return;
    }

    /* 텍스트 크기 핸들 */
    if (
      selectedBounds &&
      selectedText &&
      pointOnTextResizeHandle(
        point,
        selectedBounds,
        Number(selectedText.rotation) || 0
      )
    ) {
      pointerMode = "text-resize";
      pointerStart = {
        x: point.x,
        y: point.y,
        fontSize: selectedText.fontSize
      };

      canvas.setPointerCapture(event.pointerId);
      return;
    }

    /* 텍스트 클릭 */
    const textHit = [...state.texts]
      .reverse()
      .find(layer => {
        const bounds = textBounds.get(layer.id);

        return (
          bounds &&
          pointInsideText(
            point,
            bounds,
            Number(layer.rotation) || 0
          )
        );
      });

    if (textHit) {
      selectedImageId = null;
      selectTextLayer(textHit.id);

      const target = getSelectedText();
      pointerMode = "text-drag";
      pointerStart = {
        x: point.x,
        y: point.y,
        textX: target.x,
        textY: target.y
      };

      canvas.setPointerCapture(event.pointerId);
      return;
    }

    /* 이미지 클릭 */
    const imageHit = [...state.images]
      .reverse()
      .find(layer => pointInsideImage(point, layer));

    if (imageHit) {
      selectImageLayer(imageHit.id);
      pointerMode = "image-drag";
      pointerStart = {
        x: point.x,
        y: point.y,
        imageX: imageHit.x,
        imageY: imageHit.y
      };

      canvas.setPointerCapture(event.pointerId);
      return;
    }

    selectedImageId = null;
    selectedTextId = null;
    renderImageLayerList();
    drawCanvas();
  }
);

canvas.addEventListener(
  "pointermove",
  event => {
    if (!pointerMode || !pointerStart) return;

    const point = canvasPoint(event);

    /* 이미지 이동 */
    if (pointerMode === "image-drag") {
      const layer = getSelectedImageLayer();
      if (!layer) return;

      layer.x = pointerStart.imageX + (point.x - pointerStart.x);
      layer.y = pointerStart.imageY + (point.y - pointerStart.y);
    }

    /* 이미지 크기 */
    else if (pointerMode === "image-resize") {
      const layer = getSelectedImageLayer();
      if (!layer) return;

      const distance = Math.hypot(
        point.x - layer.x,
        point.y - layer.y
      );

      const scale = distance / pointerStart.distance;

      layer.width = Math.max(40, pointerStart.width * scale);
      layer.height = Math.max(40, pointerStart.height * scale);
    }

    /* 이미지 회전 */
    else if (pointerMode === "image-rotate") {
      const layer = getSelectedImageLayer();
      if (!layer) return;

      const angle = Math.atan2(
        point.y - layer.y,
        point.x - layer.x
      );

      const delta = angle - pointerStart.startAngle;

      layer.rotation =
        pointerStart.rotation +
        delta * 180 / Math.PI;

      syncImageControls();
    }

    /* 텍스트 회전 */
    else if (pointerMode === "text-rotate") {
      const target = getSelectedText();
      if (!target) return;

      const angle = Math.atan2(
        point.y - pointerStart.centerY,
        point.x - pointerStart.centerX
      );

      const delta = angle - pointerStart.startAngle;

      let rotation =
        pointerStart.rotation +
        delta * 180 / Math.PI;

      rotation = ((rotation + 180) % 360 + 360) % 360 - 180;
      target.rotation = Math.round(rotation);

      syncTextStyleControls();
    }

    /* 텍스트 이동 */
    else if (pointerMode === "text-drag") {
      const target = getSelectedText();
      if (!target) return;

      const dxPct = ((point.x - pointerStart.x) / canvas.width) * 100;
      const dyPct = ((point.y - pointerStart.y) / canvas.height) * 100;

      target.x = Math.max(
        0,
        Math.min(100, pointerStart.textX + dxPct)
      );

      target.y = Math.max(
        0,
        Math.min(100, pointerStart.textY + dyPct)
      );

      syncTextStyleControls();
    }

    /* 텍스트 크기 */
    else if (pointerMode === "text-resize") {
      const target = getSelectedText();
      if (!target) return;

      const dx = point.x - pointerStart.x;
      const dy = point.y - pointerStart.y;
      const delta = (dx + dy) / 8;

      target.fontSize = Math.max(
        18,
        Math.min(
          240,
          Math.round(pointerStart.fontSize + delta)
        )
      );

      syncTextStyleControls();
    }

    drawCanvas();
  }
);

function endPointer(event) {
  if (!pointerMode) return;
  pointerMode = null;
  pointerStart = null;
  if (canvas.hasPointerCapture(event.pointerId)) {
    canvas.releasePointerCapture(event.pointerId);
  }
}

canvas.addEventListener("pointerup", endPointer);
canvas.addEventListener("pointercancel", endPointer);

// -----------------------------
// 비율
// -----------------------------
document.querySelectorAll("[data-ratio]").forEach(button => {
  button.addEventListener("click", () => {
    state.ratio = button.dataset.ratio;
    syncControls();
    drawCanvas();
  });
});

// -----------------------------
// 색감
// -----------------------------
[
  [brightnessInput, "brightness", brightnessValue],
  [contrastInput, "contrast", contrastValue],
  [saturationInput, "saturation", saturationValue],
  [blurInput, "blur", blurValue]
].forEach(([input, key, valueElement]) => {
  input.addEventListener("input", () => {
    state.filters[key] = Number(input.value);
    valueElement.textContent = state.filters[key];
    updateRangeFill(input);
    drawCanvas();
  });
});

resetFiltersBtn.addEventListener("click", () => {
  state.filters = { ...DEFAULT_FILTERS };
  syncFilterControls();
  drawCanvas();
  setStatus("색감 설정을 초기화했습니다.");
});

// -----------------------------
// 이미지 테두리
// -----------------------------
borderStyleInput.addEventListener("input", () => {
  state.border.style = borderStyleInput.value;
  drawCanvas();
});

borderWidthInput.addEventListener("input", () => {
  state.border.width = Number(borderWidthInput.value);
  borderWidthValue.textContent = state.border.width;
  updateRangeFill(borderWidthInput);
  drawCanvas();
});

borderColorInput.addEventListener("input", () => {
  state.border.color = borderColorInput.value;
  drawCanvas();
});

// -----------------------------
// 저장
// -----------------------------
document.getElementById("downloadBtn").addEventListener("click", () => {
  if (state.images.length === 0) {
    setStatus("먼저 이미지를 불러오세요.", true);
    return;
  }

    const mimeType = downloadFormat.value;
    const extension = mimeType === "image/jpeg" ? "jpg" : "png";
    const quality = mimeType === "image/jpeg" ? 0.92 : undefined;

  // 선택 박스는 결과물에 포함하지 않는다.
    const previousSelectedText =
      selectedTextId;

    const previousSelectedImage =
      selectedImageId;

      selectedTextId = null;
      selectedImageId = null;

  drawCanvas();

  canvas.toBlob(blob => {
    selectedTextId =
      previousSelectedText;

    selectedImageId =
      previousSelectedImage;

    drawCanvas();

    if (!blob) {
      setStatus("이미지 파일 생성에 실패했습니다.", true);
      return;
    }

    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `pixel_image_${state.ratio.replace(":", "x")}.${extension}`;
    a.click();
    URL.revokeObjectURL(url);
    setStatus(`${extension.toUpperCase()} 이미지 저장 준비 완료`);
  }, mimeType, quality);
});

// -----------------------------
// 템플릿 / JSON
// -----------------------------
function getTemplates() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY)) || memoryTemplates;
  } catch {
    return memoryTemplates;
  }
}

function saveTemplates(templates) {
  memoryTemplates = templates.map(template => ({
    ...template,
    config: JSON.parse(JSON.stringify(template.config))
  }));

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(templates));
  } catch {
    // file://, sandboxed preview 등 localStorage가 막힌 환경에서는 메모리 저장으로 동작한다.
  }
}

function getCurrentConfig() {
  return {
    ratio: state.ratio,
    texts: cloneTexts(state.texts),
    filters: { ...state.filters },
    border: { ...state.border }
  };
}

function refreshTemplateList() {
  const templates = getTemplates();
  templateSelect.innerHTML = '<option value="">저장된 템플릿 선택</option>';

  templates.forEach(template => {
    const option = document.createElement("option");
    option.value = template.id;
    option.textContent = template.name;
    templateSelect.appendChild(option);
  });
}

document.getElementById("saveTemplateBtn").addEventListener("click", () => {
  const name = templateName.value.trim();
  if (!name) {
    setStatus("템플릿 이름을 입력하세요.", true);
    return;
  }

  const templates = getTemplates();
  const template = {
    id: makeId(),
    name,
    config: getCurrentConfig()
  };

  templates.push(template);
  saveTemplates(templates);
  refreshTemplateList();
  selectedTemplateId = template.id;
  templateSelect.value = template.id;
  setStatus("템플릿을 저장했습니다.");
});

document.getElementById("loadTemplateBtn").addEventListener("click", () => {
  const id = templateSelect.value;
  const template = getTemplates().find(item => item.id === id);

  if (!template) {
    setStatus("불러올 템플릿을 선택하세요.", true);
    return;
  }

  try {
    const config = normalizeConfig(template.config);
    state.ratio = config.ratio;
    state.texts = cloneTexts(config.texts);
    state.filters = { ...config.filters };
    state.border = { ...config.border };
    selectedTextId = 1;
    selectedTemplateId = template.id;
    templateName.value = template.name;
    syncControls();
    drawCanvas();
    setStatus("템플릿을 불러왔습니다.");
  } catch (error) {
    setStatus(`템플릿 불러오기 실패: ${error.message}`, true);
  }
});

document.getElementById("updateTemplateBtn").addEventListener("click", () => {
  const id = templateSelect.value;
  if (!id) {
    setStatus("수정할 템플릿을 선택하세요.", true);
    return;
  }

  const templates = getTemplates();
  const index = templates.findIndex(item => item.id === id);
  if (index === -1) {
    setStatus("수정할 템플릿을 찾을 수 없습니다.", true);
    return;
  }

  templates[index] = {
    ...templates[index],
    name: templateName.value.trim() || templates[index].name,
    config: getCurrentConfig()
  };

  saveTemplates(templates);
  refreshTemplateList();
  templateSelect.value = id;
  setStatus("템플릿을 수정했습니다.");
});

document.getElementById("deleteTemplateBtn").addEventListener("click", () => {
  const id = templateSelect.value;
  if (!id) {
    setStatus("삭제할 템플릿을 선택하세요.", true);
    return;
  }

  const templates = getTemplates().filter(item => item.id !== id);
  saveTemplates(templates);
  refreshTemplateList();
  selectedTemplateId = null;
  templateName.value = "";
  setStatus("템플릿을 삭제했습니다.");
});

document.getElementById("exportJsonBtn").addEventListener("click", () => {
  const data = {
    version: 2,
    templates: getTemplates()
  };

  const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "pixel-image-templates.json";
  a.click();
  URL.revokeObjectURL(url);
});

document.getElementById("importJsonBtn").addEventListener("click", () => jsonInput.click());

jsonInput.addEventListener("change", async event => {
  const file = event.target.files[0];
  if (!file) return;

  try {
    const text = await file.text();
    const data = JSON.parse(text);
    validateJson(data);
    saveTemplates(data.templates);
    refreshTemplateList();
    setStatus("JSON 템플릿 복원 완료");
  } catch (error) {
    setStatus(`JSON 가져오기 실패: ${error.message}`, true);
  }

  jsonInput.value = "";
});

function validateJson(data) {
  if (!data || ![1, 2].includes(data.version) || !Array.isArray(data.templates)) {
    throw new Error("올바른 템플릿 파일이 아닙니다.");
  }

  data.templates.forEach(template => {
    if (typeof template.id !== "string" || typeof template.name !== "string" || !template.config) {
      throw new Error("필수 템플릿 정보가 없습니다.");
    }

    const c = normalizeConfig(template.config);
    if (!RATIOS[c.ratio] || !Array.isArray(c.texts) || c.texts.length < 2) {
      throw new Error("템플릿 설정값이 올바르지 않습니다.");
    }

    const ids = new Set();
    c.texts.forEach(textLayer => {
      if (
        !Number.isInteger(textLayer.id) ||
        ids.has(textLayer.id) ||
        typeof textLayer.content !== "string" ||
        typeof textLayer.x !== "number" ||
        typeof textLayer.y !== "number" ||
        typeof textLayer.fontSize !== "number" ||
        typeof textLayer.color !== "string" ||
        typeof textLayer.fontFamily !== "string" ||
        typeof textLayer.fontWeight !== "string" ||
        typeof textLayer.strokeColor !== "string" ||
        typeof textLayer.strokeWidth !== "number"
      ) {
        throw new Error("텍스트 레이어 설정값이 올바르지 않습니다.");
      }
      ids.add(textLayer.id);
    });

    if (!ids.has(1) || !ids.has(2)) {
      throw new Error("메인 또는 보조 문구 정보가 없습니다.");
    }
  });
}

// -----------------------------
// 비숑 도움말
// -----------------------------
const HELP_COPY = {
  image: "이미지: PNG/JPEG를 여러 장 불러와 각각 이동·크기·회전할 수 있어요. 목록에서 선택·삭제하고 앞뒤 레이어 순서도 바꿀 수 있습니다.",
  text: "텍스트: 문구·폰트·크기·색상·외곽선·회전을 바꿀 수 있어요. 캔버스에서 직접 이동하고 크기·회전 핸들로 조절할 수 있습니다.",
  color: "색감: 밝기·대비·채도·블러를 각각 조절합니다. 오른쪽 COLOR 패널에서 사진 분위기를 바로 확인할 수 있어요.",
  frame: "테두리: 심플·더블·RPG 골드 프레임을 선택하고 두께와 색상을 바꿀 수 있습니다.",
  save: "저장: 편집이 끝나면 PNG 또는 JPG를 골라 다운로드합니다. 선택 박스는 최종 이미지에 포함되지 않습니다."
};

function openHelp() {
  helpDialog.hidden = false;
  bichonButton.setAttribute("aria-expanded", "true");
  helpText.textContent = "안녕! 궁금한 기능을 골라줘. 사용법을 짧게 알려줄게!";
}

function closeHelp() {
  helpDialog.hidden = true;
  bichonButton.setAttribute("aria-expanded", "false");
}

// =============================
// 비숑 도움말
// =============================

function playBichonReaction() {
  bichonButton.classList.remove("is-excited");

  // 같은 애니메이션을 연속 클릭해도 다시 실행
  void bichonButton.offsetWidth;

  bichonButton.classList.add("is-excited");
}


// 비숑 클릭
bichonButton.addEventListener("click", () => {
  if (helpDialog.hidden) {
    openHelp();
  } else {
    closeHelp();
  }

  playBichonReaction();
});


// 클릭 애니메이션 종료 후 idle 복귀
bichonButton.addEventListener("animationend", event => {
  if (event.animationName === "bichon-click") {
    bichonButton.classList.remove("is-excited");
  }
});


// X 버튼
closeHelpBtn.addEventListener("click", event => {
  event.preventDefault();
  event.stopPropagation();

  closeHelp();
});


// 이미지 / 텍스트 / 색감 / 테두리 / 저장
helpTopics.addEventListener("click", event => {
  const button = event.target.closest("[data-help]");

  if (!button) return;

  const key = button.dataset.help;

  helpText.textContent =
    HELP_COPY[key] || HELP_COPY.image;
});

// -----------------------------
// 시작
// -----------------------------

syncControls();
refreshTemplateList();
renderImageLayerList();
updateAllRangeFills();
drawCanvas();

if (document.fonts && document.fonts.ready) {
  document.fonts.ready.then(drawCanvas);
}
