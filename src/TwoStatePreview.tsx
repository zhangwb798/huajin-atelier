export default function TwoStatePreview({mode}: {mode: string}) {
  const flowing = mode === '太极态';
  const outline = flowing
    ? 'M146 65L118 75L96 97L49 262L76 273L119 165L117 227L106 337Q180 351 254 337L243 227L241 165L284 273L311 262L264 97L242 75L214 65L198 87L162 87Z'
    : 'M146 65L118 75L96 97L65 150L99 168L121 133L128 215L129 236L118 315Q180 330 242 315L231 236L232 215L239 133L261 168L295 150L264 97L242 75L214 65L198 87L162 87Z';
  return <figure className="two-state-preview">
    <svg viewBox="0 0 360 390" role="img" aria-label={flowing ? '太极态：接袖展开，腰封松解，下摆释放' : '长拳态：短袖，束腰，下摆收拢'}>
      <defs><linearGradient id="two-state-cloth"><stop stopColor="#ddd9cc"/><stop offset=".45" stopColor="#faf8f2"/><stop offset="1" stopColor="#cfc8b7"/></linearGradient></defs>
      <path className="two-state-outline" style={{d:`path("${outline}")`}} fill="url(#two-state-cloth)" stroke="#625c50" strokeWidth="1.2"/>
      <path d="M146 65V51Q162 51 180 63Q198 51 214 51V65L198 87H162Z" fill="#e8e3d6" stroke="#625c50"/>
      <path d={flowing ? 'M180 87V343M119 165L109 325M241 165L251 325' : 'M180 87V322M128 215L122 304M232 215L238 304'} fill="none" stroke="#a69b84"/>
      {[104,134,164,194,224,254,284].map(y=><path key={y} d={`M171 ${y}q9-3 18 0q-9 3-18 0`} fill="none" stroke="#817355"/>)}
      <g className="two-state-belt" style={{opacity:flowing ? .15 : 1}}>
        <path d="M128 215Q180 227 232 215L231 236Q180 247 129 236Z" fill="#9c8761" stroke="#75613e"/>
        <path d="M128 224Q180 235 232 224" fill="none" stroke="#d4c29e"/>
      </g>
      {flowing && <g fill="#e0d8c8" stroke="#817355"><path d="M49 262l27 11-4 13-27-11Z"/><path d="M284 273l27-11 4 13-27 11Z"/></g>}
      <g fill="none" stroke="#b68b5f" strokeDasharray="3 3"><path d="M74 158L102 173M258 173L286 158"/><path d="M118 314Q180 331 242 314"/></g>
      <g fontSize="10" fill="#6a604f"><text x="12" y="114">{flowing ? '暗接长袖' : '短袖接口'}</text><path d="M38 119L87 155" stroke="#9c8761"/>
        <text x="265" y="208">{flowing ? '松解腰封' : '束腰藏褶'}</text><path d="M272 214L235 226" stroke="#9c8761"/>
        <text x="139" y="372">{flowing ? '下摆释放' : '下摆收拢'}</text><path d="M180 356V343" stroke="#9c8761"/></g>
    </svg>
    <figcaption>{flowing ? '接袖展开 → 腰封松解 → 释放下摆' : '接袖收起 → 腰封束紧 → 收拢下摆'}</figcaption>
  </figure>;
}
