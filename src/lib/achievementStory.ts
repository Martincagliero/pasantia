import brandLogo from '../assets/logo.png';
import whiteBrandLogo from '../assets/images/logo-p-blanco.png';

interface StoryStat {
  label: string;
  value: string | number;
}

interface AchievementStoryOptions {
  filename: string;
  kicker: string;
  name: string;
  subtitle: string;
  rankingLabel: string;
  rank: number;
  primaryLabel: string;
  primaryValue: string | number;
  primaryCaption: string;
  stats: StoryStat[];
  quote: string;
  closing: string;
}

const FONT = 'Montserrat, sans-serif';

function setFont(ctx: CanvasRenderingContext2D, weight: number, size: number) {
  ctx.font = `${weight} ${size}px ${FONT}`;
}

function fillRoundedRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number
) {
  ctx.beginPath();
  ctx.roundRect(x, y, width, height, radius);
  ctx.fill();
}

function fittedFontSize(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number,
  startSize: number,
  minSize: number
) {
  let size = startSize;
  while (size > minSize) {
    setFont(ctx, 700, size);
    if (ctx.measureText(text).width <= maxWidth) break;
    size -= 2;
  }
  return size;
}

function drawHighlightedWord(
  ctx: CanvasRenderingContext2D,
  text: string,
  word: string,
  x: number,
  y: number
) {
  const index = text.toLocaleLowerCase('es').indexOf(word.toLocaleLowerCase('es'));
  if (index < 0) {
    setFont(ctx, 500, 27);
    ctx.fillText(text, x, y);
    return;
  }

  const before = text.slice(0, index);
  const highlighted = text.slice(index, index + word.length);
  const after = text.slice(index + word.length);
  setFont(ctx, 500, 27);
  ctx.fillText(before, x, y);
  const highlightedX = x + ctx.measureText(before).width;
  setFont(ctx, 700, 27);
  ctx.fillText(highlighted, highlightedX, y);
  const afterX = highlightedX + ctx.measureText(highlighted).width;
  setFont(ctx, 500, 27);
  ctx.fillText(after, afterX, y);
}

function drawInstagramGlyph(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  size: number,
  color: string
) {
  const line = size * 0.105;
  ctx.save();
  ctx.strokeStyle = color;
  ctx.fillStyle = color;
  ctx.lineWidth = line;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.beginPath();
  ctx.roundRect(x, y, size, size, size * 0.25);
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(x + size / 2, y + size / 2, size * 0.205, 0, Math.PI * 2);
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(x + size * 0.77, y + size * 0.23, line * 0.62, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error('No se pudo cargar el logo.'));
    image.src = src;
  });
}

async function loadStoryAssets() {
  await Promise.allSettled([
    document.fonts.ready,
    document.fonts.load(`300 30px ${FONT}`),
    document.fonts.load(`400 30px ${FONT}`),
    document.fonts.load(`500 30px ${FONT}`),
    document.fonts.load(`600 30px ${FONT}`),
    document.fonts.load(`700 30px ${FONT}`),
  ]);
  return Promise.all([loadImage(brandLogo), loadImage(whiteBrandLogo)]);
}

export async function createAchievementStory(options: AchievementStoryOptions): Promise<File> {
  const [logo, whiteLogo] = await loadStoryAssets();
  const canvas = document.createElement('canvas');
  canvas.width = 1080;
  canvas.height = 1920;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('No se pudo crear la imagen.');

  ctx.fillStyle = '#0148fd';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.drawImage(whiteLogo, 58, 46, 69, 85, 76, 72, 82, 101);

  ctx.save();
  ctx.shadowColor = 'rgba(0, 0, 0, 0.35)';
  ctx.shadowBlur = 26;
  ctx.shadowOffsetY = 12;
  ctx.fillStyle = '#090a0d';
  fillRoundedRect(ctx, 790, -170, 410, 392, 72);
  ctx.restore();
  ctx.strokeStyle = '#b9bec8';
  ctx.lineWidth = 5;
  ctx.beginPath();
  ctx.roundRect(802, -158, 386, 366, 61);
  ctx.stroke();
  ctx.fillStyle = '#1e105f';
  fillRoundedRect(ctx, 818, -142, 354, 334, 48);
  ctx.fillStyle = '#2f2384';
  fillRoundedRect(ctx, 838, 72, 314, 96, 26);
  ctx.fillStyle = '#0148fd';
  fillRoundedRect(ctx, 856, 88, 68, 68, 16);
  ctx.drawImage(logo, 856, 88, 68, 68);
  ctx.fillStyle = '#73e46f';
  fillRoundedRect(ctx, 944, 88, 68, 68, 16);
  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.arc(978, 121, 21, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#d6e2f5';
  fillRoundedRect(ctx, 1032, 88, 68, 68, 16);

  ctx.fillStyle = 'rgba(255,255,255,0.62)';
  ctx.fillRect(0, 246, 1080, 2);

  ctx.textAlign = 'left';
  ctx.fillStyle = 'rgba(255,255,255,0.72)';
  ctx.fillRect(0, 371, 54, 2);
  ctx.fillStyle = '#ffffff';
  drawHighlightedWord(ctx, options.kicker, 'impacto', 76, 382);
  const nameSize = fittedFontSize(ctx, options.name, 928, 68, 40);
  setFont(ctx, 600, nameSize);
  ctx.textAlign = 'center';
  ctx.fillText(options.name, 540, 490);

  ctx.textAlign = 'left';
  setFont(ctx, 700, 220);
  ctx.fillText(`#${String(options.rank).padStart(2, '0')}`, 48, 770);
  setFont(ctx, 500, 31);
  ctx.fillText('posición actual', 570, 760);

  ctx.save();
  ctx.shadowColor = 'rgba(0, 0, 0, 0.34)';
  ctx.shadowBlur = 28;
  ctx.shadowOffsetY = 16;
  ctx.fillStyle = '#030303';
  fillRoundedRect(ctx, 80, 842, 920, 430, 62);
  ctx.restore();

  ctx.fillStyle = '#ffffff';
  setFont(ctx, 500, 24);
  ctx.fillText(options.rankingLabel.toUpperCase(), 142, 920);
  setFont(ctx, 700, 92);
  ctx.fillText(String(options.primaryValue), 138, 1032);
  setFont(ctx, 400, 24);
  ctx.fillStyle = 'rgba(255,255,255,0.72)';
  ctx.fillText(options.primaryCaption, 142, 1075);

  const statCount = Math.max(1, options.stats.length);
  const statWidth = 790 / statCount;
  options.stats.forEach((stat, index) => {
    const x = 142 + index * statWidth;
    if (index > 0) {
      ctx.fillStyle = 'rgba(255,255,255,0.2)';
      ctx.fillRect(x - 30, 1122, 2, 88);
    }
    ctx.fillStyle = '#ffffff';
    setFont(ctx, 600, 38);
    ctx.fillText(String(stat.value), x, 1163);
    ctx.fillStyle = 'rgba(255,255,255,0.58)';
    setFont(ctx, 400, 20);
    ctx.fillText(stat.label.toUpperCase(), x, 1203);
  });

  ctx.fillStyle = '#ffffff';
  setFont(ctx, 600, 43);
  ctx.fillText(`“${options.quote}”`, 76, 1482);
  ctx.fillStyle = 'rgba(255,255,255,0.78)';
  setFont(ctx, 400, 29);
  ctx.fillText(options.closing, 76, 1540);

  setFont(ctx, 500, 27);
  const instagramHandle = 'pasant.ia';
  const instagramIconSize = 42;
  const instagramGap = 20;
  const instagramGroupWidth = instagramIconSize + instagramGap + ctx.measureText(instagramHandle).width;
  const instagramStartX = (canvas.width - instagramGroupWidth) / 2;
  drawInstagramGlyph(ctx, instagramStartX, 1703, instagramIconSize, '#ffffff');
  ctx.fillStyle = '#ffffff';
  ctx.fillText(instagramHandle, instagramStartX + instagramIconSize + instagramGap, 1736);

  ctx.textAlign = 'center';
  ctx.fillStyle = '#ffffff';
  setFont(ctx, 500, 29);
  ctx.fillText('Conectamos estudiantes con empresas.', 540, 1832);

  const blob = await new Promise<Blob>((resolve, reject) =>
    canvas.toBlob(
      (value) => (value ? resolve(value) : reject(new Error('No se pudo exportar.'))),
      'image/png'
    )
  );
  return new File([blob], options.filename, { type: 'image/png' });
}

export async function shareAchievementFile(file: File, title: string, text: string) {
  const shareData = { files: [file], title, text };
  if (navigator.share && navigator.canShare?.(shareData)) {
    await navigator.share(shareData);
    return 'shared' as const;
  }

  const url = URL.createObjectURL(file);
  const link = document.createElement('a');
  link.href = url;
  link.download = file.name;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
  return 'downloaded' as const;
}