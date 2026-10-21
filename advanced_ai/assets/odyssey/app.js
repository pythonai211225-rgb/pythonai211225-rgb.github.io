const topics = [
  {name:'Artificial Neural Networks',short:'ANN',group:'deep',level:'Beginner',color:'#8edcef',description:'Build the foundations of intelligence, one neuron at a time.',path:'01_ann/index.html',art:'network',objectives:['A neuron combines inputs with learned weights and a bias, then applies an activation function.','Layers transform those signals into increasingly useful representations.','Training uses a loss function and backpropagation to adjust weights and improve predictions.']},
  {name:'Convolutional Neural Networks',short:'CNN',group:'deep',level:'Intermediate',color:'#a78bfa',description:'Master computer vision and image recognition techniques.',path:'02_cnn/index.html',fullArt:'assets/odyssey/cnn-card.jpg',objectives:['Convolution slides small learned filters across an image to detect local patterns anywhere.','Pooling shrinks feature maps and makes the network tolerant to small shifts.','Stacked conv blocks build a feature hierarchy that a dense head turns into a class.']},
  {name:'REST API',short:'REST',group:'foundations',level:'Intermediate',color:'#61affe',description:'Serve data and models over HTTP with FastAPI.',path:'03_rest_api/index.html',cardArt:'assets/odyssey/rest-card.svg',objectives:['Resources live at URLs; the HTTP method (GET, POST, PUT, PATCH, DELETE) says what to do with them.','FastAPI turns typed Python functions into validated, self-documenting endpoints, served by Uvicorn.','Status codes, Swagger /docs and Postman make an API testable before any frontend exists.']},
  {name:'Object-Oriented Programming',short:'OOP',group:'oop',level:'Beginner',color:'#fbbf24',description:'Classes, objects and the MobilePhone example.',path:'oop/index.html',cardArt:'assets/odyssey/oop-card.svg',objectives:['A class is a blueprint; an object is one thing built from it, with its own attribute values.','__init__ sets the attributes of each new object through self; __str__ decides what print shows.','OOP fits many stateful things and big programs; small scripts and number crunching are better without it.']}
];
const cardTitles = [
 'Artificial Neural<br>Networks (ANN)',
 '',
 'REST API<br><small>FastAPI · Uvicorn</small>',
 'Object-Oriented<br>Programming (OOP)'
];
const cardDescriptions = [
 'Build and train foundational deep learning models.',
 '',
 'Serve data and models over HTTP with FastAPI.',
 'Classes, objects and a mobile phone in Python.'
];
const grid=document.querySelector('#course-grid');
function render(filter='all'){
 const shown=topics.filter(t=>filter==='all'||t.group===filter);
 grid.innerHTML=shown.map(t=>{
  const index=topics.indexOf(t);
  const href=t.path||'#';
  if(t.fullArt){
   return `<a class="course-card full-art" href="${href}" aria-label="Open ${t.name}"><img class="full-art-img" src="${t.fullArt}" alt="${t.name} — ${t.description} Level: ${t.level}." loading="lazy"></a>`;
  }
  return `<a class="course-card" href="${href}" aria-label="Open ${t.name}" style="--art-x:${(index%3)*50}%;--art-y:${Math.floor(index/3)*50}%"><div class="badge-frame"><div class="badge-rim"><div class="card-inner"><div class="card-art" aria-hidden="true"${t.cardArt?` style="background-image:url('${t.cardArt}');background-size:cover;background-position:center"`:''}></div><h3>${cardTitles[index]}</h3><p>${cardDescriptions[index]}</p><div class="card-bottom"><span class="level">${t.level}</span><span class="explore">EXPLORE COURSE</span></div></div></div></div></a>`;
 }).join('');
 document.querySelector('#course-count').textContent=`${shown.length} mission${shown.length===1?'':'s'} to discover`;
}
render();
/* shareable deep links (#projects, #lessons…): the cards above are rendered by JS and their art loads late,
   so the browser's initial jump lands too high — re-align once the layout has settled */
function alignToHash(){const t=location.hash&&document.getElementById(location.hash.slice(1));if(t)t.scrollIntoView({block:'start',behavior:'instant'})}
if(location.hash){alignToHash();window.addEventListener('load',alignToHash,{once:true})}
document.querySelectorAll('[data-filter]').forEach(button=>button.addEventListener('click',()=>{document.querySelectorAll('[data-filter]').forEach(b=>{b.classList.toggle('selected',b===button);b.setAttribute('aria-pressed',String(b===button))});render(button.dataset.filter)}));
const menu=document.querySelector('.menu-toggle'),nav=document.querySelector('#navigation');
function closeMenu(){nav.classList.remove('open');menu.setAttribute('aria-expanded','false')}
menu.addEventListener('click',()=>{const open=nav.classList.toggle('open');menu.setAttribute('aria-expanded',String(open))});
nav.addEventListener('click',e=>{if(e.target.closest('a'))closeMenu()});
document.addEventListener('keydown',e=>{if(e.key==='Escape'){closeMenu()}});
const homeSection=document.querySelector('#home');
if(homeSection){new IntersectionObserver(entries=>{entries.forEach(entry=>{document.body.classList.toggle('hero-offscreen',!entry.isIntersecting)})},{threshold:0}).observe(homeSection);}
const observer=new IntersectionObserver(entries=>{entries.forEach(entry=>{if(entry.isIntersecting)document.querySelectorAll('nav a').forEach(a=>{const active=a.hash===`#${entry.target.id}`;a.classList.toggle('active',active);if(active)a.setAttribute('aria-current','location');else a.removeAttribute('aria-current')})})},{rootMargin:'-15% 0px -55% 0px'});
document.querySelectorAll('main>section').forEach(section=>observer.observe(section));
const canvas=document.querySelector('#stars'),ctx=canvas.getContext('2d'),motion=document.querySelector('#motion'),media=matchMedia('(prefers-reduced-motion: reduce)');let paused=media.matches,raf=0,last=0,width=0,height=0;const stars=Array.from({length:75},()=>({x:Math.random(),y:Math.random(),r:Math.random()*1.2+.25,speed:Math.random()*.012+.004}));
function resize(){width=canvas.clientWidth;height=canvas.clientHeight;const ratio=Math.min(devicePixelRatio||1,2);canvas.width=width*ratio;canvas.height=height*ratio;ctx.setTransform(ratio,0,0,ratio,0,0);draw(0)}
function draw(dt){ctx.clearRect(0,0,width,height);stars.forEach(s=>{if(!paused)s.x=(s.x+s.speed*dt)%1;ctx.beginPath();ctx.fillStyle=`rgba(196,231,255,${.3+s.r*.3})`;ctx.arc(s.x*width,s.y*height,s.r,0,Math.PI*2);ctx.fill()})}
function frame(time){draw(Math.min((time-last)/1000,.05));last=time;raf=requestAnimationFrame(frame)}
function syncMotion(){document.body.classList.toggle('paused',paused);motion.setAttribute('aria-pressed',String(paused));motion.textContent=paused?'▷ Play motion':'Ⅱ Pause motion';cancelAnimationFrame(raf);if(!paused&&!document.hidden){last=performance.now();raf=requestAnimationFrame(frame)}}
motion.addEventListener('click',()=>{paused=!paused;syncMotion()});media.addEventListener('change',e=>{paused=e.matches;syncMotion()});document.addEventListener('visibilitychange',syncMotion);window.addEventListener('resize',resize);resize();syncMotion();
