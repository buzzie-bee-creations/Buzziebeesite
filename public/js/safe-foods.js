const STORAGE_KEY = 'buzziebee_safe_foods_v1';

function readSavedFoods(slotCount) {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return Array(slotCount).fill('');
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return Array(slotCount).fill('');
    return Array.from({ length: slotCount }, (_, idx) =>
      typeof parsed[idx] === 'string' ? parsed[idx] : ''
    );
  } catch {
    return Array(slotCount).fill('');
  }
}

function writeSavedFoods(values) {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(values));
  } catch {
    // Ignore storage errors (e.g., private browsing quota restrictions)
  }
}

async function downloadSheetAsPng(sheet, templateImg, inputs) {
  const size = templateImg.naturalWidth || 1024;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  ctx.drawImage(templateImg, 0, 0, size, size);

  const sheetRect = sheet.getBoundingClientRect();
  const scale = sheetRect.width > 0 ? size / sheetRect.width : size / 740;
  const fontSizePx = Math.round(size * 0.0225);

  ctx.fillStyle = '#2c3748';
  ctx.font = `500 ${fontSizePx}px "Plus Jakarta Sans", system-ui, -apple-system, sans-serif`;
  ctx.textBaseline = 'middle';

  inputs.forEach((input) => {
    const text = input.value.trim();
    if (!text) return;

    const inputRect = input.getBoundingClientRect();
    if (sheetRect.width > 0 && sheetRect.height > 0) {
      const x = (inputRect.left - sheetRect.left + 4) * scale;
      const y = (inputRect.top - sheetRect.top + inputRect.height * 0.5) * scale;
      const maxWidth = Math.max(40, (inputRect.width - 8) * scale);
      ctx.fillText(text, x, y, maxWidth);
    }
  });

  const link = document.createElement('a');
  link.download = 'buzzie-bee-safe-foods.png';
  link.href = canvas.toDataURL('image/png');
  document.body.appendChild(link);
  link.click();
  link.remove();
}

export function initSafeFoodsSheet() {
  const sheet = document.getElementById('safe-foods-sheet');
  if (!sheet) return;

  const templateImg = sheet.querySelector('.safe-foods-template-img');
  const inputs = Array.from(sheet.querySelectorAll('.safe-foods-input[data-safe-food-slot]'));
  const printBtn = document.getElementById('safe-foods-print-btn');
  const clearBtn = document.getElementById('safe-foods-clear-btn');
  const fallbackBox = document.getElementById('safe-foods-print-fallback');
  const downloadBtn = document.getElementById('safe-foods-download-btn');

  if (!inputs.length) return;

  const values = readSavedFoods(inputs.length);
  inputs.forEach((input, idx) => {
    input.value = values[idx] || '';

    input.addEventListener('input', () => {
      values[idx] = input.value;
      writeSavedFoods(values);
    });
  });

  printBtn?.addEventListener('click', async () => {
    if (templateImg && typeof templateImg.decode === 'function') {
      try {
        await templateImg.decode();
      } catch {
        // Proceed even if decode throws
      }
    }

    let printDialogOpened = false;
    const onBeforePrint = () => {
      printDialogOpened = true;
      if (fallbackBox) fallbackBox.hidden = true;
    };

    window.addEventListener('beforeprint', onBeforePrint, { once: true });

    try {
      window.print();
    } catch {
      printDialogOpened = false;
    }

    window.setTimeout(() => {
      window.removeEventListener('beforeprint', onBeforePrint);
      if (!printDialogOpened && fallbackBox) {
        fallbackBox.hidden = false;
      }
    }, 300);
  });

  downloadBtn?.addEventListener('click', async () => {
    if (!templateImg) return;
    if (!templateImg.complete && typeof templateImg.decode === 'function') {
      try {
        await templateImg.decode();
      } catch {
        return;
      }
    }
    await downloadSheetAsPng(sheet, templateImg, inputs);
  });

  clearBtn?.addEventListener('click', () => {
    inputs.forEach((input, idx) => {
      input.value = '';
      values[idx] = '';
    });
    try {
      window.localStorage.removeItem(STORAGE_KEY);
    } catch {
      // Ignore storage errors
    }
    inputs[0]?.focus();
  });
}
