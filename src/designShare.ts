import {performance} from './Story';
import {materials, primaryMotifs, secondaryMotifs, motifPositionKey, motifSizeKey, motifCopies} from './FittingPreview';

export type DesignConfig = {
  line: '竞赛' | '表演'; gender: string; style: string; color: string;
  primary: string; secondary: string[]; custom: string; extras: string[];
};
type Design = {cfg: DesignConfig; form: Record<string, string>};
const colors = ['朱砂','玄墨','靛青','月白','绛紫','鎏金','黛蓝','松绿','赭石','缃色','霜灰','胭脂'];
const crafts: Record<string, string[]> = {
  '面料': materials, '版型': ['做大','正常做','修身'], '袖型': ['上袖','连袖'],
  '扣位': ['3 扣','7 扣'], '装饰': ['不做','满天星宽钻','满天星窄钻'],
  '扣型': ['盘口','钻扣'], '钻色': ['白钻','彩钻','黄钻'],
};

// Keep personal details and free-text fields out of shared design links.
function sanitize(value: unknown): Design {
  const data = value as {v?: unknown; cfg?: Partial<DesignConfig>; form?: Record<string, unknown>};
  if (!data || data.v !== 1 || !data.cfg || !data.form || typeof data.form !== 'object') throw new Error('Invalid design');
  const c = data.cfg;
  const styles = c.line === '竞赛' ? ['长拳服','太极服','南拳服'] : performance.map(item => item.name);
  if ((c.line !== '竞赛' && c.line !== '表演') || !['女款','男款'].includes(c.gender || '') ||
      !styles.includes(c.style || '') || !colors.includes(c.color || '')) throw new Error('Invalid selections');
  const cfg: DesignConfig = {
    line: c.line, gender: c.gender!, style: c.style!, color: c.color!,
    primary: primaryMotifs.includes(c.primary || '') ? c.primary! : '',
    secondary: Array.isArray(c.secondary) ? [...new Set(c.secondary.filter(name => secondaryMotifs.includes(name)))].slice(0, 3) : [],
    custom: '',
    extras: c.line === '表演' && Array.isArray(c.extras)
      ? [...new Set(c.extras.filter(name => ['亮片披风','流苏腰饰','织锦头饰','档期加急'].includes(name)))] : [],
  };
  const form: Record<string, string> = {};
  for (const [key, options] of Object.entries(crafts)) {
    const entry = data.form[key];
    if (typeof entry === 'string' && options.includes(entry)) form[key] = entry;
  }
  const copies = motifCopies(data.form).filter(copy => [cfg.primary,...cfg.secondary].includes(copy.name));
  if (copies.length) form['纹样副本'] = JSON.stringify(copies);
  for (const name of [cfg.primary, ...cfg.secondary, ...copies.map(copy => copy.id)].filter(Boolean)) {
    const position = data.form[motifPositionKey(name)];
    if (typeof position === 'string' && position.length < 80) {
      const coordinates = position.split(',').map(Number);
      if (coordinates.length === 2 && coordinates.every(Number.isFinite)) {
        form[motifPositionKey(name)] = coordinates.join(', ');
      }
    }
    const size = data.form[motifSizeKey(name)];
    if (typeof size === 'string' && /^\d+(\.\d+)?%$/.test(size)) {
      const percentage = Number.parseFloat(size);
      if (percentage >= 25 && percentage <= 300) form[motifSizeKey(name)] = size;
    }
  }
  return {cfg, form};
}

export function createDesignLink(cfg: DesignConfig, form: Record<string, string>) {
  const design = sanitize({v: 1, cfg, form});
  const bytes = new TextEncoder().encode(JSON.stringify({v: 1, ...design}));
  const encoded = btoa(Array.from(bytes, byte => String.fromCharCode(byte)).join(''))
    .replaceAll('+', '-').replaceAll('/', '_').replace(/=+$/, '');
  const url = new URL(window.location.href);
  url.search = '';
  url.hash = 'design=' + encoded;
  return url.href;
}

export function readDesignLink(hash: string): Design | null {
  try {
    const encoded = hash.slice('#design='.length);
    if (!hash.startsWith('#design=') || !/^[A-Za-z0-9_-]{1,40000}$/.test(encoded)) return null;
    const binary = atob(encoded.replaceAll('-', '+').replaceAll('_', '/'));
    const json = new TextDecoder('utf-8', {fatal: true}).decode(Uint8Array.from(binary, ch => ch.charCodeAt(0)));
    return sanitize(JSON.parse(json));
  } catch {
    return null;
  }
}
