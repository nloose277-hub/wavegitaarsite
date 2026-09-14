import { useEffect, useRef, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { BANK_LOGOS } from '../data/bankLogos';
import idealLogo from '../assets/ideal/ideal-logo.svg';
import successLight from '../assets/ideal/success-light.png';
import successDark from '../assets/ideal/success-dark.png';

const PRIMARY = '#CC0066';
const BG = '#EEF5F7';
const FONT = '"Lexend Deca", sans-serif';
const HEAD = '"Roboto Slab", serif';
const BANKS = [
  'ABN AMRO',
  'Adyen',
  'ASN Bank',
  'ASN Bank vh RegioBank',
  'ASN Bank voorheen SNS',
  'bunq',
  'BUUT',
  'Finom',
  'ING',
  'Knab',
  'Mollie',
  'N26',
  'Nationale-Nederlanden',
  'Rabobank',
  'Revolut',
  'Triodos Bank',
  'Van Lanschot Kempen',
  'Yoursafe',
];


function formatAmount(value: string | null) {
  const n = Number(value);
  if (!Number.isFinite(n)) return '€0,00';
  return new Intl.NumberFormat('nl-NL', { style: 'currency', currency: 'EUR' }).format(n);
}

function BankLogo({ name }: { name: string }) {
  const [failed, setFailed] = useState(false);
  const src = BANK_LOGOS[name];
  if (!src || failed) return (
    <div style={{ width:48,height:48,borderRadius:8,background:'#e9edf0',display:'grid',placeItems:'center',fontWeight:700,color:'#555' }}>
      {name.charAt(0)}
    </div>
  );
  return <img src={src} alt="" onError={() => setFailed(true)} style={{ width:48,height:48,borderRadius:8,objectFit:'contain',background:'#fff' }} />;
}

export default function IdealPayment() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const amount = formatAmount(params.get('amount'));
  const order = params.get('order') || '';
  const tracking = params.get('tracking') || '';
  const [selected,setSelected] = useState<string|null>(null);
  const [loading,setLoading] = useState(false);
  const [transfer,setTransfer] = useState(false);
  const [confirm,setConfirm] = useState(false);
  const [success,setSuccess] = useState(false);
  const [copied,setCopied] = useState<string|null>(null);
  const [dark,setDark] = useState(false);
  const canvasRef=useRef<HTMLCanvasElement>(null);

  const root={minHeight:'100vh',background:dark?'#121212':BG,color:dark?'#fff':'#232323',fontFamily:FONT,display:'flex',flexDirection:'column' as const};

  useEffect(()=>{
    if(!success) return;
    const c=canvasRef.current;if(!c)return;
    const ctx=c.getContext('2d');if(!ctx)return;
    const resize=()=>{c.width=innerWidth;c.height=innerHeight}; resize();
    const pieces=Array.from({length:100},()=>({x:Math.random()*c.width,y:-Math.random()*c.height,vx:(Math.random()-.5)*2,vy:2+Math.random()*3,r:Math.random()*6,w:5+Math.random()*7,h:3+Math.random()*5}));
    let raf=0;
    const draw=()=>{ctx.clearRect(0,0,c.width,c.height);for(const p of pieces){ctx.save();ctx.translate(p.x,p.y);ctx.rotate(p.r);ctx.fillStyle=['#CC0066','#ff6eb4','#ffd700','#00c8ff','#7cfc00','#ff4500'][Math.floor(Math.random()*6)];ctx.fillRect(-p.w/2,-p.h/2,p.w,p.h);ctx.restore();p.x+=p.vx;p.y+=p.vy;p.r+=.02;p.vy+=.03;if(p.y>c.height+20)p.y=-20;}raf=requestAnimationFrame(draw)};draw();
    return()=>cancelAnimationFrame(raf);
  },[success]);

  const copy=(value:string,key:string)=>navigator.clipboard?.writeText(value.replace(/\s/g,'' )).then(()=>{setCopied(key);setTimeout(()=>setCopied(null),1500)});

  if(success) return <div style={{...root,position:'fixed',inset:0,overflow:'hidden',alignItems:'center',justifyContent:'center'}}>
    <canvas ref={canvasRef} style={{position:'absolute',inset:0,pointerEvents:'none'}}/>
    <div style={{position:'relative',zIndex:1,width:'min(560px,calc(100% - 40px))',textAlign:'center'}}>
      <img src={dark?successDark:successLight} alt="" style={{width:240,height:240,objectFit:'contain'}}/>
      <h1 style={{fontFamily:HEAD,fontWeight:400,fontSize:32}}>Betaling is <span style={{color:PRIMARY,fontStyle:'italic'}}>gelukt!</span></h1>
      <p style={{opacity:.6}}>Bedankt voor je betaling aan WaveGitaar.</p>
      <button onClick={()=>navigate(`/checkout/success?order=${encodeURIComponent(order)}&tracking=${encodeURIComponent(tracking)}`)} style={btn}>Verder</button>
    </div>
  </div>;

  const header=<header style={{height:72,background:PRIMARY,color:'#fff',display:'flex',alignItems:'center',justifyContent:'space-between',padding:'0 20px'}}>
    <img src={idealLogo} alt="iDEAL" style={{width:106,height:40}}/>
    <div style={{textAlign:'right'}}><div style={{fontWeight:700,fontSize:20}}>{amount}</div><div style={{fontSize:14,opacity:.9}}>WaveGitaar</div></div>
  </header>;
  const footer=<footer style={{marginTop:'auto',padding:'20px 16px 30px',borderTop:`1px solid ${dark?'#333':'#ddd'}`,display:'flex',justifyContent:'space-between',fontSize:12,opacity:.6}}><span>WaveGitaar</span><button onClick={()=>setDark(v=>!v)} style={{background:'none',border:0,color:'inherit',cursor:'pointer'}}>{dark?'Lichte modus':'Donkere modus'}</button></footer>;

  if(confirm) return <div style={root}>{header}<main style={main}><h2 style={h2}>Betaling bevestigen</h2><p style={muted}>Heb je het bedrag al overgemaakt naar onze rekening?</p><button onClick={()=>setSuccess(true)} style={btn}>Ja, ik heb betaald</button><button onClick={()=>setConfirm(false)} style={secondary}>Nee, nog niet betaald</button></main>{footer}</div>;

  if(transfer) {
    const details=[['Bedrag',amount,'bedrag'],['Ten name van','WaveGitaar','naam'],['IBAN','NL00 0000 0000 0000 00','iban'],['Omschrijving',order||'WaveGitaar bestelling','omschrijving']];
    return <div style={root}>{header}<main style={main}><button onClick={()=>setTransfer(false)} style={back}>← Terug</button><h2 style={h2}>Handmatig overmaken</h2><p style={muted}>Maak het bedrag over naar onderstaande gegevens. Je bestelling wordt verwerkt na ontvangst van de betaling.</p><div style={{background:dark?'#1c1c1c':'#fff',border:`1px solid ${dark?'#333':'#ddd'}`,borderRadius:12,overflow:'hidden',marginBottom:24}}>{details.map(([l,v,k],i)=><div key={k} onClick={()=>k!=='bedrag'&&k!=='naam'&&copy(v,k)} style={{display:'flex',gap:10,padding:'14px',borderBottom:i<3?`1px solid ${dark?'#333':'#eee'}`:'none',cursor:k==='iban'||k==='omschrijving'?'pointer':'default'}}><span style={{width:95,fontSize:12,opacity:.55}}>{l}</span><span style={{flex:1,fontSize:13}}>{v}</span>{(k==='iban'||k==='omschrijving')&&<span style={{fontSize:12,color:copied===k?'#07bc0c':PRIMARY}}>{copied===k?'✓':'Kopieer'}</span>}</div>)}</div><button onClick={()=>setConfirm(true)} style={btn}>Ik heb betaald</button><button onClick={()=>setTransfer(false)} style={secondary}>Annuleren</button></main>{footer}</div>;
  }

  if(selected && loading) return <div style={root}>{header}<main style={{...main,justifyContent:'center'}}><div style={{width:48,height:48,borderRadius:'50%',border:'3px solid #ddd',borderTopColor:PRIMARY,animation:'spin .9s linear infinite'}}/><p style={muted}>Verbinding maken met {selected}…</p><style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style></main></div>;

  if(selected) return <div style={root}>{header}<main style={main}><button onClick={()=>setSelected(null)} style={back}>Annuleren</button><h2 style={h2}>Technische storing</h2><p style={muted}>Op dit moment kan de betaling via de geselecteerde bank niet worden afgerond.</p><p style={muted}>Je kunt je bestelling alsnog verwerken door het bedrag handmatig over te maken.</p><button onClick={()=>setTransfer(true)} style={btn}>Handmatig overmaken</button><button onClick={()=>setSelected(null)} style={back}>← Terug naar banken</button></main>{footer}</div>;

  return <div style={root}>{header}<main style={main}><h2 style={{...h2,fontSize:40}}>Kies je bank</h2><p style={muted}>Selecteer je bank om verder te gaan.</p><div style={{display:'grid',gap:8}}>{BANKS.map(name=><button key={name} onClick={()=>{setSelected(name);setLoading(true);setTimeout(()=>setLoading(false),1800)}} style={{all:'unset',boxSizing:'border-box',cursor:'pointer',display:'flex',alignItems:'center',gap:16,width:'100%',padding:4,border:`1px solid ${dark?'#555':'#777'}`,borderRadius:12,background:dark?'#1c1c1c':'#fff',color:'inherit'}}><BankLogo name={name}/><span>{name}</span></button>)}</div></main>{footer}</div>;
}
const main={flex:1,width:'min(600px,calc(100% - 32px))',margin:'0 auto',padding:'32px 0 40px',display:'flex',flexDirection:'column' as const,alignItems:'center'};
const h2={margin:'0 0 14px',fontFamily:HEAD,fontWeight:400,fontSize:28,textAlign:'center' as const};
const muted={textAlign:'center' as const,opacity:.62,lineHeight:1.7,margin:'0 0 28px'};
const btn={all:'unset' as const,boxSizing:'border-box' as const,width:'100%',background:PRIMARY,color:'#fff',padding:'16px 20px',borderRadius:12,textAlign:'center' as const,cursor:'pointer',fontFamily:FONT,fontWeight:500,marginBottom:10};
const secondary={...btn,background:'#121212'};
const back={all:'unset' as const,color:PRIMARY,fontFamily:FONT,fontWeight:500,cursor:'pointer',marginBottom:18};
