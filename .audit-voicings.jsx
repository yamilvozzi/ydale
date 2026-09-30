import React, {useState} from 'react'
import {createRoot} from 'react-dom/client'
import {MemoryRouter, Routes, Route, Outlet, Link} from 'react-router-dom'
import Notas from './src/components/tabs/Notas'
import Escala from './src/components/tabs/Escala'
import {PinProvider} from './src/context/PinContext'
import PinGate from './src/components/PinGate'
import {supabase} from './src/lib/supabaseClient'
import {crearAcorde,guardarNotas} from './src/lib/notasConAcordes'
import './src/index.css'
const manual=crearAcorde(); manual.nombre='Manual previo'; manual.trastes=['1','2','3','4']; manual.posiciones[2][1]='presionada'
const tema={id:'audit',notas:guardarNotas({texto:'Texto original',acordes:[manual]}),tonalidad:'C',escala_nombre:'Mayor'}
const db={temas:[tema],escalas:[{id:'escala-1',tema_id:'audit',tonica:'C',tipo:'blues',orden:0}]}
window.alert=message=>{document.getElementById('audit-alert').textContent=message}
let modo='normal'
supabase.from=(table)=>{
 let op='select',valor,filters=[]
 async function ejecutar(single=false){
  if(op!=='select'){
   if(modo==='error')return {data:null,error:{message:'Error simulado'}}
   if(modo==='demora')await new Promise(resolve=>setTimeout(resolve,3500))
  }
  const rows=db[table].filter(r=>filters.every(([k,v])=>r[k]===v))
  if(op==='update')rows.forEach(r=>Object.assign(r,valor))
  if(op==='insert')db[table].push({...valor,id:crypto.randomUUID()})
  if(op==='delete')db[table]=db[table].filter(r=>!rows.includes(r))
  return {data:structuredClone(single?rows[0]:rows),error:null}
 }
 const b={select:()=>b,eq:(k,v)=>{filters.push([k,v]);return b},order:()=>b,update:v=>{op='update';valor=v;return b},insert:v=>{op='insert';valor=v;return b},delete:()=>{op='delete';return b},single:()=>ejecutar(true),then:(a,z)=>ejecutar().then(a,z)}
 return b
}
function Shell(){const [t,setT]=useState({...tema});const [m,setM]=useState('normal');return <main className="mx-auto max-w-6xl p-4"><nav className="mb-4 flex gap-4"><Link to="/">NOTAS</Link><Link to="/escala">ESCALAS</Link><label>Red <select aria-label="Red de prueba" value={m} onChange={e=>{modo=e.target.value;setM(modo)}}><option value="normal">Normal</option><option value="error">Error</option><option value="demora">Demora</option></select></label></nav><p id="audit-alert" role="alert"/><Outlet context={{tema:t,actualizarCampoLocal:(campo,valor)=>setT(a=>({...a,[campo]:valor}))}}/><output aria-label="Persistido" className="sr-only">{JSON.stringify(db)}</output></main>}
createRoot(document.getElementById('root')).render(<React.StrictMode><PinProvider><PinGate><MemoryRouter><Routes><Route element={<Shell/>}><Route index element={<Notas/>}/><Route path="escala" element={<Escala/>}/></Route></Routes></MemoryRouter></PinGate></PinProvider></React.StrictMode>)
