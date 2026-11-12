import {useEffect, useId, useRef, useState, type KeyboardEvent, type PointerEvent} from 'react';

const palette:Record<string,string>={朱砂:'#ab3f38',玄墨:'#282c30',靛青:'#344c78',月白:'#e8eee9',绛紫:'#614663',鎏金:'#b99b56',黛蓝:'#305560',松绿:'#42654e',赭石:'#91624a',缃色:'#dac778',霜灰:'#a8afb2',胭脂:'#b66b7b'};

type Outfit = {
  line: string; gender: string; style: string; color: string;
  primary: string; secondary: string[]; custom: string; extras: string[];
};

const asset = (folder: 'motifs' | 'accessories', name: string) =>
  `./assets/preview/${folder}/${encodeURIComponent(name)}.png`;

export const motifImage = (name: string) => asset('motifs', name);
export const motifPositionKey = (name: string) => `纹样位置 · ${name}`;

export const materials = ['真丝', '仿丝', '棉麻'];

export default function FittingPreview({cfg, form, onMotifMove}: {
  cfg: Outfit;
  form: Record<string, string>;
  onMotifMove?: (name: string, position: string) => void;
}) {
  const [zoom, setZoom] = useState(false);
  const id = useId();
  const drag = useRef<{pointer: number; dx: number; dy: number} | null>(null);
  const motifs = [
    ...(cfg.primary ? [{name: cfg.primary, x: 180, y: 174, size: 44}] : []),
    ...cfg.secondary.map((name, index) => ({name, x: 146 + index * 33, y: 281 + index % 2 * 8, size: 24})),
  ];

  const colorIndex = Math.max(0, Object.keys(palette).indexOf(cfg.color));
  const sampleX = 45 + (colorIndex % 4) * 338;
  const sampleY = [0, 361, 720][Math.floor(colorIndex / 4)];
  const sampleSheet = cfg.gender === '男款' ? 'male' : 'female';
  const cut = ({'长拳服': 'changquan', '太极服': 'taiji', '南拳服': 'nanquan'} as Record<string, string>)[cfg.style];
  const cutImage = cut ? `./assets/preview/cuts/${cut}-${sampleSheet}.webp` : '';

  const sleeveLength = cut === 'taiji' ? 3 : cut === 'nanquan' ? (cfg.gender === '男款' ? 0 : 1) : 2;
  const previousSleeveLength = useRef(sleeveLength);
  const sleeveMotion = sleeveLength > previousSleeveLength.current ? 'extending'
    : sleeveLength < previousSleeveLength.current ? 'shortening' : '';
  useEffect(() => {
    previousSleeveLength.current = sleeveLength;
  }, [sleeveLength]);
  useEffect(() => {
    for (const style of ['changquan', 'taiji', 'nanquan']) {
      for (const gender of ['male', 'female']) {
        const image = new Image();
        image.src = `./assets/preview/cuts/${style}-${gender}.webp`;
      }
    }
  }, []);

  function move(name: string, x: number, y: number) {
    const left = Math.round(Math.min(230, Math.max(130, x)));
    const top = Math.round(Math.min(291, Math.max(138, y)));
    onMotifMove?.(name, `${left}, ${top}`);
  }

  function pointerPosition(event: PointerEvent<SVGImageElement>) {
    const matrix = event.currentTarget.ownerSVGElement?.getScreenCTM();
    return matrix && new DOMPoint(event.clientX, event.clientY).matrixTransform(matrix.inverse());
  }

  function nudge(event: KeyboardEvent<SVGImageElement>, name: string, x: number, y: number) {
    const step = event.shiftKey ? 10 : 2;
    const offsets: Record<string, [number, number]> = {ArrowUp: [0, -step], ArrowDown: [0, step], ArrowLeft: [-step, 0], ArrowRight: [step, 0]};
    const offset = offsets[event.key];
    if (!offset) return;
    event.preventDefault();
    move(name, x + offset[0], y + offset[1]);
  }
  const material = materials.includes(form['面料']) ? form['面料'] : materials[0];
  const stage = cfg.line === '表演';
  const color = palette[cfg.color] || palette.朱砂;
  const trim = ['月白','缃色','霜灰'].includes(cfg.color) ? '#856c41' : '#ebd29c';
  const has = (module: string) => cfg.extras.includes(module);

  const body = cut ? (cfg.gender === '女款'
    ? 'M128 107L156 90H204L232 107L220 203L235 326H125L140 203Z'
    : 'M112 106L154 89H206L248 106L247 326H113Z')
    : cfg.gender === '女款'
    ? 'M130 119L162 106 180 120 198 106 230 119 217 201 224 243 235 305Q180 321 125 305L136 243 143 201Z'
    : 'M126 119L162 106 180 120 198 106 234 119 227 213 238 305Q180 319 122 305L133 213Z';
  const cuffPlacement = cfg.gender === '男款' ? 'translate(48 252) rotate(10)' : 'translate(81 209) rotate(18)';
  const cuffWidth = cfg.gender === '男款' ? 43 : 32;
  const mirror = 'translate(360 0) scale(-1 1)';
  const cape = 'M128 120Q68 191 48 299Q180 331 312 299Q292 191 232 120Z';
  const belt = 'M137 224Q180 236 223 224L228 244Q180 256 132 244Z';
  const hasCape = stage && has('亮片披风');
  const studs = stage && ['满天星宽钻','满天星窄钻'].includes(form['装饰']);
  const diamondColor = (index: number) => form['钻色'] === '黄钻' ? '#f0d273'
    : form['钻色'] === '彩钻' ? ['#acd9d8','#e5b6d7','#efd498'][index % 3] : '#fff';

  return <aside className="fitting-preview" aria-label="写实样衣定制预览">
    <div className="preview-title">
      <div><span className="section-label">HUAJIN / DESIGN PREVIEW</span><h3>彩服设计预览</h3></div>
      <button type="button" onClick={() => setZoom(!zoom)} aria-pressed={zoom}>{zoom ? '查看上衣' : '查看细节'}</button>
    </div>
    <div className="avatar-stage" style={{background: '#fff'}}>
      <svg viewBox={zoom ? '34 80 292 246' : '32 56 296 288'} role="img"
        aria-label={`${cfg.gender}、${cfg.style}、${cfg.color}的写实样衣定制预览`}>
        <defs>
          <pattern id={`${id}-satin-stitches`} width="1.25" height="1.25" patternUnits="userSpaceOnUse" patternTransform="rotate(38)">
            <path d="M0 .24H1.05" stroke="#fff6dc" strokeWidth=".32" opacity=".7"/>
            <path d="M0 .74H1.05" stroke="#493421" strokeWidth=".20" opacity=".38"/>
          </pattern>
          <filter id={`${id}-primary-thread`} x="-8%" y="-8%" width="116%" height="116%" colorInterpolationFilters="sRGB">
            <feTurbulence type="fractalNoise" baseFrequency="1.2 .25" numOctaves="2" seed="8" result="fiber"/>
            <feComposite in="fiber" in2="SourceAlpha" operator="in" result="thread"/>
            <feBlend in="SourceGraphic" in2="thread" mode="soft-light"/>
            <feDropShadow dx="0" dy=".28" stdDeviation=".16" floodColor="#3b2919" floodOpacity=".35"/>
          </filter>
          {cutImage && <mask id={`${id}-cut-alpha`} x="36" y="56" width="288" height="288" maskUnits="userSpaceOnUse" style={{maskType: 'alpha'}}>
            <image href={cutImage} x="36" y="56" width="288" height="288"/>
          </mask>}
          <pattern id={`${id}-stitches`} width="2.2" height="2.2" patternUnits="userSpaceOnUse" patternTransform="rotate(32)">
            <path d="M0 .5H2.2" stroke="#fff5df" strokeWidth=".38" opacity=".48"/>
            <path d="M0 1.4H2.2" stroke="#38291b" strokeWidth=".30" opacity=".32"/>
          </pattern>
          <filter id={`${id}-thread-relief`} x="-10%" y="-10%" width="120%" height="120%" colorInterpolationFilters="sRGB">
            <feDropShadow dx="0" dy=".42" stdDeviation=".28" floodColor="#322719" floodOpacity=".32"/>
          </filter>
          <clipPath id={`${id}-sleeves`}>
            <rect x="36" y="56" width="78" height="288"/><rect x="246" y="56" width="78" height="288"/>
          </clipPath>
          <clipPath id={`${id}-torso`}><rect x="114" y="56" width="132" height="288"/></clipPath>
          <clipPath id={`${id}-sample`}><rect x={sampleX} y={sampleY} width="338" height="320"/></clipPath>
          <clipPath id={`${id}-body`}><path d={body}/></clipPath>
        </defs>
        {cutImage ? <g key={cutImage} className={sleeveMotion ? `garment-change ${sleeveMotion}` : undefined}>
          {['torso', 'sleeves'].map(part => <g key={part} clipPath={`url(#${id}-${part})`}>
            <g className={`garment-${part}`} style={{isolation: 'isolate'}}>
              <image href={cutImage} x="36" y="56" width="288" height="288"/>
              <rect x="36" y="56" width="288" height="288" fill={color}
                mask={`url(#${id}-cut-alpha)`} style={{mixBlendMode: 'multiply'}}/>
            </g>
          </g>)}
        </g> : <svg x="32" y="56" width="296" height="288" viewBox={`${sampleX} ${sampleY} 338 320`} aria-hidden="true">
          <image href={`./assets/preview/${sampleSheet}.webp`} width="1448" height="1086" clipPath={`url(#${id}-sample)`}/>
        </svg>}
        {hasCape && <path d={cape} fill={color} fillOpacity=".18" stroke={trim} strokeOpacity=".7"/>}
        <g data-layer="motif" clipPath={`url(#${id}-body)`}>
          {motifs.map(({name, x, y, size}) => {
            const [storedX, storedY] = (form[motifPositionKey(name)] || '').split(',').map(Number);
            const placed = Number.isFinite(storedX) && Number.isFinite(storedY);
            const centerX = placed ? storedX : x;
            const centerY = placed ? storedY : y;
            const x0 = centerX - size / 2;
            const y0 = centerY - size / 2;
            const threadMask = `${id}-thread-${name}`;
            return <g key={name}>
              <mask id={threadMask} x={x0} y={y0} width={size} height={size} maskUnits="userSpaceOnUse" style={{maskType: 'alpha'}}>
                <image href={motifImage(name)} x={x0} y={y0} width={size} height={size}/>
              </mask>
              <image href={motifImage(name)} x={x0} y={y0}
              width={size} height={size} filter={`url(#${id}-${name === cfg.primary ? 'primary-thread' : 'thread-relief'})`} role="img" aria-label={onMotifMove ? `${name}纹样，可拖动或用方向键移动` : `${name}纹样`}
              tabIndex={onMotifMove ? 0 : undefined}
              style={onMotifMove ? {cursor: 'move', touchAction: 'none'} : undefined}
              onPointerDown={event => {
                if (!onMotifMove || !event.isPrimary || event.button !== 0) return;
                const point = pointerPosition(event);
                if (!point) return;
                event.currentTarget.setPointerCapture(event.pointerId);
                drag.current = {pointer: event.pointerId, dx: centerX - point.x, dy: centerY - point.y};
              }}
              onPointerMove={event => {
                const active = drag.current;
                if (!active || active.pointer !== event.pointerId) return;
                const point = pointerPosition(event);
                if (point) move(name, point.x + active.dx, point.y + active.dy);
              }}
              onLostPointerCapture={() => {drag.current = null;}}
              onKeyDown={onMotifMove ? event => nudge(event, name, centerX, centerY) : undefined}/>
              <rect x={x0} y={y0} width={size} height={size} pointerEvents="none"
                mask={`url(#${threadMask})`} fill={`url(#${id}-${name === cfg.primary ? 'satin-stitches' : 'stitches'})`}/>
            </g>;
          })}
        </g>
        <g data-layer="accessory" pointerEvents="none">
          {studs && [undefined, mirror].map((transform, index) =>
            <g key={index} transform={transform}>
              <image href={asset('accessories','袖口')} transform={cuffPlacement} width={cuffWidth} height="7" preserveAspectRatio="none"/>
            </g>)}
          {has('云肩绣片') && <path d="M132 121l28-8 20 16 20-16 28 8 12 19-24 14-16-10-20 10-20-10-16 10-24-14Z" fill={trim} fillOpacity=".65" stroke={trim}/>}
          {has('龙凤胸片') && <g>
            <path d="M149 151q31-14 62 0v56q-31 12-62 0Z" fill={color} stroke={trim}/>
            <image href={asset('motifs','龙')} x="150" y="162" width="30" height="34"/>
            <image href={asset('motifs','凤')} x="180" y="162" width="30" height="34"/>
          </g>}
          {(has('织锦腰封') || has('流苏腰饰')) && <path d={belt} fill={trim} stroke={color}/>}
          {has('流苏腰饰') && Array.from({length: 9}, (_, index) =>
            <path key={index} d={`M${139 + index * 10} 245v${18 + (index % 3) * 4}`} stroke={trim} strokeWidth="2"/>)}
          {has('织锦头饰') && <path d="M152 82q28-34 56 0l-3-14-13 4-12-12-12 12-13-4Z" fill={trim} stroke={color}/>}
          {stage && form['扣型'] === '钻扣' &&
            (cfg.gender === '男款' ? [104,139,171,207,243,275] : [94,122,148,175,201,227,254]).map((y, index) =>
              <circle key={y} cx="183" cy={y} r="2.4" fill={diamondColor(index)} stroke={trim} strokeWidth=".6"/>)}
          {studs && (!form['钻色'] || form['钻色'] === '白钻') &&
            Array.from({length: 6}, (_, index) =>
              <image key={index} href={asset('accessories','水钻')} x={145 + index % 3 * 25}
                y={150 + Math.floor(index / 3) * 88} width={form['装饰'] === '满天星宽钻' ? 14 : 11} height="15"/>)}
          {studs && ['彩钻','黄钻'].includes(form['钻色']) && Array.from({length: 42}, (_, index) =>
            <circle key={index} cx={145 + index % 7 * 11} cy={156 + Math.floor(index / 7) * 25}
              r={form['装饰'] === '满天星宽钻' ? 1.65 : 1.15} fill={diamondColor(index)}
              stroke="#73695a" strokeWidth=".3"/>)}
        </g>
      </svg>
    </div>
    <div className="preview-caption">
      {onMotifMove && <small>{motifs.length ? '拖动衣身上的纹样调整位置，也可选中后用方向键微调。' : '先选择纹样，再在衣身上拖动摆放。'}</small>}

      <strong>{cfg.color} · {material} · {cfg.style} · {cfg.gender}</strong>
      <span>{[cfg.primary,...cfg.secondary,...cfg.extras.filter(name => name !== '档期加急')].filter(Boolean).join(' / ') || '选择纹样与模块，查看搭配效果'}</span>
      {cfg.custom && <small>自定义纹样「{cfg.custom}」待设计确认，未绘入预览。</small>}
      <small>写实样衣展示配色和装饰位置。面料、扣数与成衣细节以配置单及打样为准。</small>
    </div>
  </aside>;
}
