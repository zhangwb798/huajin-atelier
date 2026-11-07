import {useId, useRef, useState, type KeyboardEvent, type PointerEvent} from 'react';

const palette:Record<string,string>={朱砂:'#ab3f38',玄墨:'#282c30',靛青:'#344c78',月白:'#e8eee9',绛紫:'#614663',鎏金:'#b99b56',黛蓝:'#305560',松绿:'#42654e',赭石:'#91624a',缃色:'#dac778',霜灰:'#a8afb2',胭脂:'#b66b7b'};

type Outfit = {
  line: string; gender: string; style: string; color: string;
  primary: string; secondary: string[]; custom: string; extras: string[];
};

const asset = (folder: 'textures' | 'motifs', name: string) =>
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
    ...(cfg.primary ? [{name: cfg.primary, x: 180, y: 174, size: 64}] : []),
    ...cfg.secondary.map((name, index) => ({name, x: 146 + index * 33, y: 281 + index % 2 * 8, size: 36})),
  ];

  function move(name: string, x: number, y: number) {
    const left = Math.round(Math.min(214, Math.max(146, x)));
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
  const southern = cfg.style === '南拳服';
  const wide = cfg.style === '太极服' || ['舞台演出','戏曲元素','奇幻造型'].includes(cfg.style);
  const color = palette[cfg.color] || palette.朱砂;
  const trim = ['月白','缃色','霜灰'].includes(cfg.color) ? '#856c41' : '#ebd29c';
  const has = (module: string) => cfg.extras.includes(module);

  const body = cfg.gender === '女款'
    ? 'M130 119L162 106 180 120 198 106 230 119 217 201 224 243 235 305Q180 321 125 305L136 243 143 201Z'
    : 'M126 119L162 106 180 120 198 106 234 119 227 213 238 305Q180 319 122 305L133 213Z';
  const sleeve = wide ? 'M137 116L103 128 48 236 88 255 129 186 149 155Z'
    : southern ? 'M137 116L107 129 111 156 134 170 149 149Z'
    : 'M137 116L105 128 73 183 108 203 132 168 149 147Z';
  const cuff = wide ? 'M51 230l40 19-3 6-40-19Z'
    : southern ? 'M110 150l25 14-1 6-23-14Z'
    : 'M76 178l35 19-3 6-35-20Z';
  const collar = 'M162 106V94Q173 94 180 103Q187 94 198 94V106L180 121Z';
  const mirror = 'translate(360 0) scale(-1 1)';
  const cape = 'M128 120Q68 191 48 299Q180 331 312 299Q292 191 232 120Z';
  const belt = 'M137 224Q180 236 223 224L228 244Q180 256 132 244Z';
  const hasCape = stage && has('亮片披风');
  const studs = stage && ['满天星宽钻','满天星窄钻'].includes(form['装饰']);
  const diamondColor = (index: number) => form['钻色'] === '黄钻' ? '#f0d273'
    : form['钻色'] === '彩钻' ? ['#acd9d8','#e5b6d7','#efd498'][index % 3] : '#fff';
  const fasteners = cfg.style === '长拳服' && cfg.gender === '女款' && form['扣位'] === '7 扣' ? 7 : 3;

  return <aside className="fitting-preview" aria-label="服装分层预览">
    <div className="preview-title">
      <div><span className="section-label">HUAJIN / DESIGN PREVIEW</span><h3>彩服设计预览</h3></div>
      <button type="button" onClick={() => setZoom(!zoom)} aria-pressed={zoom}>{zoom ? '查看上衣' : '查看细节'}</button>
    </div>
    <div className="avatar-stage layered-stage" style={{background: '#fff'}}>
      <svg viewBox={zoom ? '34 80 292 246' : '32 56 296 288'} role="img"
        aria-label={`${cfg.gender}、${cfg.style}、${material}、${cfg.color}的平面设计稿`}>
        <defs>
          <clipPath id={`${id}-garment`}>
            {hasCape && <path d={cape}/>}
            <path d={sleeve}/><path d={sleeve} transform={mirror}/>
            <path d={body}/><path d={collar}/>
          </clipPath>
          <clipPath id={`${id}-body`}><path d={body}/></clipPath>
        </defs>
        <g data-layer="garment" style={{isolation: 'isolate'}}>
          <rect x="35" y="85" width="290" height="245" fill="#fff" clipPath={`url(#${id}-garment)`}/>
          <image data-layer="material" href={asset('textures', material)}
            x="35" y="85" width="290" height="245" preserveAspectRatio="none" clipPath={`url(#${id}-garment)`}/>
          <rect data-layer="color" x="35" y="85" width="290" height="245" fill={color}
            clipPath={`url(#${id}-garment)`} style={{mixBlendMode: 'multiply'}}/>
          <g fill="none" stroke="#342f2b" strokeOpacity=".6" strokeWidth="1.25" strokeLinejoin="round">
            {hasCape && <path d={cape} stroke={trim}/>}
            <path d={sleeve}/><path d={sleeve} transform={mirror}/><path d={body}/><path d={collar}/>
            <path d="M180 121v191"/>
          </g>
        </g>
        <g data-layer="motif" clipPath={`url(#${id}-body)`}>
          {motifs.map(({name, x, y, size}) => {
            const [storedX, storedY] = (form[motifPositionKey(name)] || '').split(',').map(Number);
            const placed = Number.isFinite(storedX) && Number.isFinite(storedY);
            const centerX = placed ? storedX : x;
            const centerY = placed ? storedY : y;
            return <image key={name} href={motifImage(name)} x={centerX - size / 2} y={centerY - size / 2}
              width={size} height={size} role="img" aria-label={onMotifMove ? `${name}纹样，可拖动或用方向键移动` : `${name}纹样`}
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
              onKeyDown={onMotifMove ? event => nudge(event, name, centerX, centerY) : undefined}/>;
          })}
        </g>
        <g data-layer="accessory" pointerEvents="none">
          <path d={cuff} fill={trim}/><path d={cuff} transform={mirror} fill={trim}/>
          <path d="M162 95q12 1 18 8 6-7 18-8M126 304q54 15 108 0" fill="none" stroke={trim} strokeWidth="1.8"/>
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
          {Array.from({length: fasteners}, (_, index) => {
            const y = 130 + index * (fasteners === 7 ? 25 : 37);
            return <g key={index} stroke={trim}>
              <path d={`M166 ${y}q14 -5 28 0q-14 5 -28 0Z`} fill={color} strokeWidth="1.5"/>
              <circle cx="180" cy={y} r="2.8" fill={stage && form['扣型'] === '钻扣' ? diamondColor(index) : trim}/>
            </g>;
          })}
          {studs && Array.from({length: 42}, (_, index) =>
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
      <small>平面设计示意，实际面料、刺绣与尺寸以打样确认为准。</small>
    </div>
  </aside>;
}
