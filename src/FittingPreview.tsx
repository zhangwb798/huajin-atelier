import {useEffect, useLayoutEffect, useId, useRef, useState, type KeyboardEvent, type PointerEvent} from 'react';

const palette:Record<string,string>={朱砂:'#ab3f38',玄墨:'#282c30',靛青:'#344c78',月白:'#e8eee9',绛紫:'#614663',鎏金:'#b99b56',黛蓝:'#305560',松绿:'#42654e',赭石:'#91624a',缃色:'#dac778',霜灰:'#a8afb2',胭脂:'#b66b7b'};

type Outfit = {
  line: string; gender: string; style: string; color: string;
  primary: string; secondary: string[]; custom: string; extras: string[];
};

const asset = (folder: 'motifs' | 'accessories', name: string) =>
  `./assets/preview/${folder}/${encodeURIComponent(name)}.png`;

export const primaryMotifs = ['龙','凤','虎','鹿','鹤'];
export const secondaryMotifs = ['竹','兰','梅','菊','云纹'];
const suppliedMotifs = new Set([...primaryMotifs, ...secondaryMotifs]);
export const motifImage = (name: string) =>
  `./assets/preview/references/${encodeURIComponent(name)}.webp`;

function ReferenceFilter({id}: {id: string}) {
  return <filter id={id} colorInterpolationFilters="sRGB">
    <feColorMatrix type="matrix" values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  -1.0625 -3.577 -0.3605 0 5"/>
    <feComposite in2="SourceAlpha" operator="in"/>
  </filter>;
}

export function MotifThumbnail({name}: {name: string}) {
  const id = useId();
  return <svg viewBox="0 0 100 100" width="28" height="28" aria-hidden="true" style={{display:'block',margin:'0 auto 3px'}}>
    <defs><ReferenceFilter id={id}/></defs>
    <image href={motifImage(name)} width="100" height="100"
      filter={suppliedMotifs.has(name) ? `url(#${id})` : undefined}/>
  </svg>;
}
export const motifPositionKey = (name: string) => `纹样位置 · ${name}`;
export const motifSizeKey = (name: string) => `纹样大小 · ${name}`;

function motifScale(value?: string) {
  const percentage = Number.parseFloat(value || '');
  return Number.isFinite(percentage) ? Math.min(300, Math.max(25, percentage)) : 100;
}

export const materials = ['真丝', '仿丝', '棉麻'];

export default function FittingPreview({cfg, form, onMotifMove, onMotifResize}: {
  cfg: Outfit;
  form: Record<string, string>;
  onMotifMove?: (name: string, position: string) => void;
  onMotifResize?: (name: string, percentage: string) => void;
}) {
  const [view, setView] = useState({x: 32, y: 56, width: 296, height: 288});
  const viewRef = useRef(view);
  const previewRef = useRef<SVGSVGElement>(null);
  const magnification = Math.round(296 / view.width * 100);

  function resetView() {
    const next = {x: 32, y: 56, width: 296, height: 288};
    viewRef.current = next;
    setView(next);
  }
  const [selectedName, setSelectedName] = useState('');
  const id = useId();
  const drag = useRef<{
    pointer: number; name: string; element: SVGGElement;
    dx: number; dy: number; x: number; y: number; originX: number; originY: number;
  } | null>(null);
  const frame = useRef<number | null>(null);
  const pan = useRef<{
    pointer: number; startX: number; startY: number; inverse: DOMMatrix;
    origin: typeof view; next: typeof view;
  } | null>(null);
  const panFrame = useRef<number | null>(null);
  const [panning, setPanning] = useState(false);

  function updatePan(event: PointerEvent<SVGSVGElement>) {
    const active = pan.current;
    if (!active || active.pointer !== event.pointerId) return;
    const dx = event.clientX - active.startX;
    const dy = event.clientY - active.startY;
    active.next = {
      ...active.origin,
      x: active.origin.x - dx * active.inverse.a - dy * active.inverse.c,
      y: active.origin.y - dx * active.inverse.b - dy * active.inverse.d,
    };
    if (panFrame.current === null) {
      panFrame.current = requestAnimationFrame(() => {
        panFrame.current = null;
        if (pan.current === active) {
          viewRef.current = active.next;
          setView(active.next);
        }
      });
    }
  }

  function stopPan(event: PointerEvent<SVGSVGElement>, cancelled = false) {
    const active = pan.current;
    if (!active || active.pointer !== event.pointerId) return;
    if (!cancelled) updatePan(event);
    pan.current = null;
    if (panFrame.current !== null) {
      cancelAnimationFrame(panFrame.current);
      panFrame.current = null;
    }
    const next = cancelled ? active.origin : active.next;
    viewRef.current = next;
    setView(next);
    setPanning(false);
    if (event.currentTarget.hasPointerCapture(active.pointer)) {
      event.currentTarget.releasePointerCapture(active.pointer);
    }
  }
  useEffect(() => {
    const svg = previewRef.current;
    if (!svg) return;
    function zoomView(event: WheelEvent) {
      if (!event.deltaY) return;
      event.preventDefault();
      if (drag.current || pan.current) return;
      const matrix = svg!.getScreenCTM();
      if (!matrix) return;
      const anchor = new DOMPoint(event.clientX, event.clientY).matrixTransform(matrix.inverse());
      const current = viewRef.current;
      const delta = event.deltaY * (event.deltaMode === 1 ? 16 : event.deltaMode === 2 ? svg!.clientHeight : 1);
      const scale = Math.min(4, Math.max(.5, 296 / current.width * Math.exp(-Math.min(250, Math.max(-250, delta)) * .0015)));
      const width = 296 / scale;
      const height = 288 / scale;
      const next = {
        x: anchor.x - (anchor.x - current.x) * width / current.width,
        y: anchor.y - (anchor.y - current.y) * height / current.height,
        width, height,
      };
      viewRef.current = next;
      setView(next);
    }
    svg.addEventListener('wheel', zoomView, {passive: false});
    return () => svg.removeEventListener('wheel', zoomView);
  }, []);
  useEffect(() => () => {
    if (frame.current !== null) cancelAnimationFrame(frame.current);
    if (panFrame.current !== null) cancelAnimationFrame(panFrame.current);
  }, []);
  const motifs = [
    ...(primaryMotifs.includes(cfg.primary) ? [{name: cfg.primary, x: 180, y: 174, size: 44}] : []),
    ...cfg.secondary.filter(name => secondaryMotifs.includes(name)).map((name, index) => ({name, x: 146 + index * 33, y: 281 + index % 2 * 8, size: 24})),
  ];

  const activeMotif = motifs.find(motif => motif.name === selectedName) || motifs[0];
  const activeScale = activeMotif ? motifScale(form[motifSizeKey(activeMotif.name)]) : 100;

  function resize(percentage: number) {
    if (activeMotif) onMotifResize?.(activeMotif.name, `${Math.min(300, Math.max(25, percentage))}%`);
  }

  const colorIndex = Math.max(0, Object.keys(palette).indexOf(cfg.color));
  const sampleX = 45 + (colorIndex % 4) * 338;
  const sampleY = [0, 361, 720][Math.floor(colorIndex / 4)];
  const sampleSheet = cfg.gender === '男款' ? 'male' : 'female';
  const cut = ({'长拳服': 'changquan', '太极服': 'taiji', '南拳服': 'nanquan'} as Record<string, string>)[cfg.style];
  const adjustableFasteners = cfg.style === '长拳服' && cfg.gender === '女款';
  const fastenerCount = form['扣位'] === '7 扣' ? 7 : 3;
  const cutImage = adjustableFasteners ? './assets/preview/cuts/changquan-female-plain.webp' : cut ? `./assets/preview/cuts/${cut}-${sampleSheet}.webp` : '';

  const [previousCut, setPreviousCut] = useState('');
  const lastCut = useRef(cutImage);
  useLayoutEffect(() => {
    const previous = lastCut.current;
    lastCut.current = cutImage;
    if (!previous || previous === cutImage) {
      setPreviousCut('');
      return;
    }
    setPreviousCut(previous);
    const timer = setTimeout(() => setPreviousCut(''), 600);
    return () => clearTimeout(timer);
  }, [cutImage]);
  useEffect(() => {
    for (const style of ['changquan', 'taiji', 'nanquan']) {
      for (const gender of ['male', 'female']) {
        const image = new Image();
        image.src = `./assets/preview/cuts/${style}-${gender}.webp`;
      }
    }
  }, []);

  function move(name: string, x: number, y: number) {
    if (Number.isFinite(x) && Number.isFinite(y)) {
      onMotifMove?.(name, `${x.toFixed(2)}, ${y.toFixed(2)}`);
    }
  }

  function pointerPosition(event: PointerEvent<SVGGElement>) {
    const matrix = event.currentTarget.ownerSVGElement?.getScreenCTM();
    return matrix && new DOMPoint(event.clientX, event.clientY).matrixTransform(matrix.inverse());
  }

  function stopDrag(cancelled = false) {
    const active = drag.current;
    if (!active) return;
    drag.current = null;
    if (frame.current !== null) {
      cancelAnimationFrame(frame.current);
      frame.current = null;
    }
    const x = cancelled ? active.originX : active.x;
    const y = cancelled ? active.originY : active.y;
    active.element.setAttribute('transform', `translate(${x} ${y})`);
    if (active.element.hasPointerCapture(active.pointer)) {
      active.element.releasePointerCapture(active.pointer);
    }
    if (!cancelled) move(active.name, x, y);
  }

  function nudge(event: KeyboardEvent<SVGGElement>, name: string, x: number, y: number) {
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
  const cordTint = [1,3,5].map(index => Math.min(1, parseInt(color.slice(index,index+2),16) / 255 * 1.3));
  const trim = ['月白','缃色','霜灰'].includes(cfg.color) ? '#856c41' : '#ebd29c';
  const has = (module: string) => stage && cfg.extras.includes(module);

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
      <div className="preview-view-controls">
        <output aria-label="视图缩放倍率">{magnification}%</output>
        <button type="button" onClick={resetView}>重置视图</button>
      </div>
    </div>
    <div className="avatar-stage" style={{background: '#fff'}}>
      <svg ref={previewRef} style={{touchAction: 'none', cursor: panning ? 'grabbing' : 'grab'}}
        viewBox={`${view.x} ${view.y} ${view.width} ${view.height}`} role="img"
        onDragStart={event => event.preventDefault()}
        onPointerDown={event => {
          if (!event.isPrimary || event.button !== 0 || drag.current || pan.current) return;
          if (onMotifMove && (event.target as Element).closest('.movable-motif')) return;
          const matrix = event.currentTarget.getScreenCTM();
          if (!matrix) return;
          event.preventDefault();
          event.currentTarget.setPointerCapture(event.pointerId);
          pan.current = {
            pointer: event.pointerId, startX: event.clientX, startY: event.clientY,
            inverse: matrix.inverse(), origin: {...viewRef.current}, next: {...viewRef.current},
          };
          setPanning(true);
        }}
        onPointerMove={updatePan}
        onPointerUp={event => stopPan(event)}
        onPointerCancel={event => stopPan(event, true)}
        onLostPointerCapture={event => stopPan(event, true)}
        aria-label={`${cfg.gender}、${cfg.style}、${cfg.color}的写实样衣定制预览`}>
        <defs>
          <ReferenceFilter id={`${id}-reference`}/>
          <filter id={`${id}-cord`} x="-8%" y="-35%" width="116%" height="180%" colorInterpolationFilters="sRGB">
            <feColorMatrix type="matrix" values={`${cordTint[0]} 0 0 0 0  0 ${cordTint[1]} 0 0 0  0 0 ${cordTint[2]} 0 0  0 0 0 1 0`}/>
            <feDropShadow dx="0" dy=".22" stdDeviation=".14" floodColor="#21170f" floodOpacity=".3"/>
          </filter>
          {cutImage && <mask id={`${id}-cut-alpha`} x="36" y="56" width="288" height="288" maskUnits="userSpaceOnUse" style={{maskType: 'alpha'}}>
            <image href={cutImage} x="36" y="56" width="288" height="288"/>
          </mask>}
          {previousCut && <mask id={`${id}-previous-alpha`} x="36" y="56" width="288" height="288" maskUnits="userSpaceOnUse" style={{maskType: 'alpha'}}>
            <image href={previousCut} x="36" y="56" width="288" height="288"/>
          </mask>}
          <clipPath id={`${id}-sample`}><rect x={sampleX} y={sampleY} width="338" height="320"/></clipPath>
        </defs>
        {cutImage ? <g key={cutImage}>
          {previousCut && <g key={previousCut} className="garment-previous" style={{isolation: 'isolate'}} pointerEvents="none">
            <image href={previousCut} x="36" y="56" width="288" height="288"/>
            <rect x="36" y="56" width="288" height="288" fill={color}
              mask={`url(#${id}-previous-alpha)`} style={{mixBlendMode: 'multiply'}}/>
          </g>}
          <g className={previousCut ? 'garment-enter' : undefined} style={{isolation: 'isolate'}}>
            <image href={cutImage} x="36" y="56" width="288" height="288"/>
            <rect x="36" y="56" width="288" height="288" fill={color}
              mask={`url(#${id}-cut-alpha)`} style={{mixBlendMode: 'multiply'}}/>
          </g>
        </g> : <svg x="32" y="56" width="296" height="288" viewBox={`${sampleX} ${sampleY} 338 320`} aria-hidden="true">
          <image href={`./assets/preview/${sampleSheet}.webp`} width="1448" height="1086" clipPath={`url(#${id}-sample)`}/>
        </svg>}
        {adjustableFasteners && <g data-layer="fasteners" pointerEvents="none">
          {Array.from({length: fastenerCount}, (_, index) => {
            const y = 100 + index * (fastenerCount === 7 ? 29 : 48);
            return <image key={index} data-fastener={index + 1}
              href="./assets/preview/accessories/frog-cord.webp"
              x="163.5" y={y - 1.3} width="24" height="2.6"
              preserveAspectRatio="xMidYMid meet" filter={`url(#${id}-cord)`}/>;
          })}
        </g>}
        {hasCape && <path d={cape} fill={color} fillOpacity=".18" stroke={trim} strokeOpacity=".7"/>}
        <g data-layer="motif">
          {motifs.map(({name, x, y, size: baseSize}) => {
            const size = baseSize * motifScale(form[motifSizeKey(name)]) / 100;
            const stored = (form[motifPositionKey(name)] || '').split(',').map(Number);
            const placed = stored.length === 2 && stored.every(Number.isFinite);
            const centerX = placed ? stored[0] : x;
            const centerY = placed ? stored[1] : y;
            return <g key={name} className="movable-motif" transform={`translate(${centerX} ${centerY})`}
              role="img" aria-label={onMotifMove ? `${name}纹样，可自由拖动或用方向键移动` : `${name}纹样`}
              tabIndex={onMotifMove ? 0 : undefined}
              onFocus={() => setSelectedName(name)}
              style={onMotifMove ? {cursor: 'grab', touchAction: 'none'} : undefined}
              onDragStart={event => event.preventDefault()}
              onPointerDown={event => {
                if (!onMotifMove || !event.isPrimary || event.button !== 0) return;
                const point = pointerPosition(event);
                if (!point) return;
                event.preventDefault();
                setSelectedName(name);
                event.currentTarget.focus({preventScroll: true});
                event.currentTarget.setPointerCapture(event.pointerId);
                drag.current = {
                  pointer: event.pointerId, name, element: event.currentTarget,
                  dx: centerX - point.x, dy: centerY - point.y,
                  x: centerX, y: centerY, originX: centerX, originY: centerY,
                };
              }}
              onPointerMove={event => {
                const active = drag.current;
                if (!active || active.pointer !== event.pointerId) return;
                const point = pointerPosition(event);
                if (!point) return;
                active.x = point.x + active.dx;
                active.y = point.y + active.dy;
                if (frame.current === null) {
                  frame.current = requestAnimationFrame(() => {
                    frame.current = null;
                    if (drag.current === active) {
                      active.element.setAttribute('transform', `translate(${active.x} ${active.y})`);
                    }
                  });
                }
              }}
              onPointerUp={event => {
                if (drag.current?.pointer !== event.pointerId) return;
                const point = pointerPosition(event);
                if (point) {
                  drag.current.x = point.x + drag.current.dx;
                  drag.current.y = point.y + drag.current.dy;
                }
                stopDrag();
              }}
              onPointerCancel={() => stopDrag(true)}
              onLostPointerCapture={() => stopDrag(true)}
              onKeyDown={onMotifMove ? event => nudge(event, name, centerX, centerY) : undefined}>
              <image href={motifImage(name)} x={-size / 2} y={-size / 2} width={size} height={size}
                filter={`url(#${id}-reference)`} pointerEvents="none"/>
              <rect x={-size / 2} y={-size / 2} width={size} height={size} fill="transparent"/>
            </g>;
          })}
        </g>
        <g data-layer="accessory" pointerEvents="none">
          {studs && [undefined, mirror].map((transform, index) =>
            <g key={index} transform={transform}>
              <image href={asset('accessories','袖口')} transform={cuffPlacement} width={cuffWidth} height="7" preserveAspectRatio="none"/>
            </g>)}
          {has('流苏腰饰') && <path d={belt} fill={trim} stroke={color}/>}
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
    {onMotifResize && activeMotif && <div className="motif-size-control">
      <label>调整图案
        <select aria-label="选择要缩放的图案" value={activeMotif.name} onChange={event => setSelectedName(event.target.value)}>
          {motifs.map(motif => <option key={motif.name} value={motif.name}>{motif.name}</option>)}
        </select>
      </label>
      <div className="motif-size-slider">
        <button type="button" aria-label="缩小图案" disabled={activeScale <= 25} onClick={() => resize(activeScale - 10)}>−</button>
        <input type="range" aria-label="图案大小" min="25" max="300" step="5" value={activeScale}
          onChange={event => resize(Number(event.target.value))}/>
        <button type="button" aria-label="放大图案" disabled={activeScale >= 300} onClick={() => resize(activeScale + 10)}>＋</button>
        <output aria-live="polite">{activeScale}%</output>
      </div>
    </div>}
    <div className="preview-caption">
      <small>{onMotifMove ? '滚轮缩放视图；按住样服或空白处拖动视图，按住图案拖动图案。' : '滚轮缩放视图；按住样服拖动视图。'}</small>
      {onMotifMove && <small>{motifs.length ? '拖动纹样自由摆放，也可选中后用方向键微调。' : '先选择纹样，再在衣身上拖动摆放。'}</small>}

      <strong>{cfg.color} · {material} · {cfg.style} · {cfg.gender}{adjustableFasteners ? ` · ${fastenerCount} 扣` : ''}</strong>
      <span>{[cfg.primary,...cfg.secondary,...(stage ? cfg.extras.filter(name => name !== '档期加急') : [])].filter(Boolean).join(' / ') || '选择纹样与模块，查看搭配效果'}</span>
      {cfg.custom && <small>自定义纹样「{cfg.custom}」待设计确认，未绘入预览。</small>}
      <small>写实样衣展示配色和装饰位置。面料与成衣细节以配置单及打样为准。</small>
    </div>
  </aside>;
}
