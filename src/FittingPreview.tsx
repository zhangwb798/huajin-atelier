import {useId, useState} from 'react';

const palette:Record<string,string>={朱砂:'#ab3f38',玄墨:'#282c30',靛青:'#344c78',月白:'#e8eee9',绛紫:'#614663',鎏金:'#b99b56',黛蓝:'#305560',松绿:'#42654e',赭石:'#91624a',缃色:'#dac778',霜灰:'#a8afb2',胭脂:'#b66b7b'};

type Outfit = {
  line: string; gender: string; style: string; color: string;
  primary: string; secondary: string[]; custom: string; extras: string[];
};

const asset = (folder: 'textures' | 'motifs', name: string) =>
  `./assets/preview/${folder}/${encodeURIComponent(name)}.png`;

export default function FittingPreview({cfg, form, onMaterialChange}: {
  cfg: Outfit;
  form: Record<string, string>;
  onMaterialChange?: (material: string) => void;
}) {
  const [zoom, setZoom] = useState(false);
  const id = useId();
  const material = form['面料'] === '棉麻' ? '棉麻' : '真丝';
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
  const trousers = 'M126 280L117 359 124 480 165 480 180 354 195 480 236 480 243 359 234 280Z';
  const mirror = 'translate(360 0) scale(-1 1)';
  const cape = 'M128 120Q68 191 45 417Q180 452 315 417Q292 191 232 120Z';
  const belt = 'M137 224Q180 236 223 224L228 244Q180 256 132 244Z';
  const hasCape = stage && has('亮片披风');
  const studs = stage && ['满天星宽钻','满天星窄钻'].includes(form['装饰']);
  const diamondColor = (index: number) => form['钻色'] === '黄钻' ? '#f0d273'
    : form['钻色'] === '彩钻' ? ['#acd9d8','#e5b6d7','#efd498'][index % 3] : '#fff';
  const fasteners = cfg.style === '长拳服' && cfg.gender === '女款' && form['扣位'] === '7 扣' ? 7 : 3;

  return <aside className="fitting-preview" aria-label="服装分层预览">
    <div className="preview-title">
      <div><span className="section-label">HUAJIN / DESIGN PREVIEW</span><h3>彩服设计预览</h3></div>
      <button type="button" onClick={() => setZoom(!zoom)} aria-pressed={zoom}>{zoom ? '查看全套' : '查看细节'}</button>
    </div>
    <div className="avatar-stage layered-stage" style={{background: '#fff'}}>
      <svg viewBox={zoom ? '34 80 292 246' : '22 59 316 447'} role="img"
        aria-label={`${cfg.gender}、${cfg.style}、${material}、${cfg.color}的平面设计稿`}>
        <defs>
          <clipPath id={`${id}-garment`}>
            {hasCape && <path d={cape}/>}
            <path d={trousers}/><path d={sleeve}/><path d={sleeve} transform={mirror}/>
            <path d={body}/><path d={collar}/>
          </clipPath>
          <clipPath id={`${id}-body`}><path d={body}/></clipPath>
        </defs>
        <g data-layer="garment" style={{isolation: 'isolate'}}>
          <rect x="35" y="85" width="290" height="405" fill="#fff" clipPath={`url(#${id}-garment)`}/>
          <image data-layer="material" href={asset('textures', material)}
            x="35" y="85" width="290" height="405" preserveAspectRatio="none" clipPath={`url(#${id}-garment)`}/>
          <rect data-layer="color" x="35" y="85" width="290" height="405" fill={color}
            clipPath={`url(#${id}-garment)`} style={{mixBlendMode: 'multiply'}}/>
          <g fill="none" stroke="#342f2b" strokeOpacity=".6" strokeWidth="1.25" strokeLinejoin="round">
            {hasCape && <path d={cape} stroke={trim}/>}
            <path d="M125 308L117 359 124 480 165 480 180 354 195 480 236 480 243 359 235 308"/>
            <path d={sleeve}/><path d={sleeve} transform={mirror}/><path d={body}/><path d={collar}/>
            <path d="M180 121v191M132 332l5 132m91-132-5 132"/>
          </g>
        </g>
        <g data-layer="motif" clipPath={`url(#${id}-body)`}>
          {cfg.primary && <image href={asset('motifs', cfg.primary)} x="148" y="142" width="64" height="64"/>}
          {cfg.secondary.map((name, index) =>
            <image key={name} href={asset('motifs', name)} x={128 + index * 33} y={263 + index % 2 * 8} width="36" height="36"/>)}
        </g>
        <g data-layer="accessory">
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
      {onMaterialChange && <div role="group" aria-label="选择面料" className="choices">
        {['真丝','棉麻'].map(name => <button key={name} type="button" aria-pressed={material === name}
          onClick={() => onMaterialChange(name)}>{name}</button>)}
      </div>}
      <strong>{cfg.color} · {material} · {cfg.style} · {cfg.gender}</strong>
      <span>{[cfg.primary,...cfg.secondary,...cfg.extras.filter(name => name !== '档期加急')].filter(Boolean).join(' / ') || '选择纹样与模块，查看搭配效果'}</span>
      {cfg.custom && <small>自定义纹样「{cfg.custom}」待设计确认，未绘入预览。</small>}
      <small>平面设计示意，实际面料、刺绣与尺寸以打样确认为准。</small>
    </div>
  </aside>;
}
