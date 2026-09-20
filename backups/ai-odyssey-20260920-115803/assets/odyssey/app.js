const topics = [
  {name:'Artificial Neural Networks',short:'ANN',group:'deep',level:'Beginner',color:'#8edcef',description:'Build the foundations of intelligence, one neuron at a time.',path:'advanced_ai/01_ann/index.html',art:'network',objectives:['A neuron combines inputs with learned weights and a bias, then applies an activation function.','Layers transform those signals into increasingly useful representations.','Training uses a loss function and backpropagation to adjust weights and improve predictions.']},
  {name:'Convolutional Neural Networks',short:'CNN',group:'deep',level:'Intermediate',color:'#c2a2f3',description:'See the bigger picture. Discover how machines learn to see.',art:'vision',objectives:['Convolutional filters scan an image to detect local patterns such as edges and textures.','Shared filter weights let the same feature be recognized across different image positions.','Pooling reduces spatial dimensions; deeper layers combine features for tasks such as image classification.']},
  {name:'Recurrent Neural Networks',short:'RNN',group:'deep',level:'Advanced',color:'#e6c48b',description:'Connect the dots across time, language, and sequences.',art:'sequence',objectives:['A recurrent network updates a hidden state for each item in a sequence.','That state carries information from earlier inputs into later predictions.','LSTM and GRU gates help retain useful context over longer sequences and reduce training difficulties.']},
  {name:'NumPy & Numerical Computing',short:'NUMPY',group:'foundations',level:'Beginner',color:'#81d3c7',description:'Your launchpad for arrays, vectors, and fast numerical thinking.',path:'python_libs/02_numpy/index.html',art:'array',objectives:['Create and reshape arrays, and select data using indexing and slicing.','Use broadcasting and vectorized operations to calculate without manual element-by-element loops.','Explore aggregation, descriptive statistics, and the shapes of numerical data.']},
  {name:'Pandas & Data Exploration',short:'PANDAS',group:'foundations',level:'Beginner',color:'#9fbaf5',description:'Turn raw information into a universe of useful insights.',path:'python_libs/03_pandas/index.html',art:'data',objectives:['Load tabular data into a DataFrame and inspect columns, types, and missing values.','Filter rows, create new columns, and combine tables with joins.','Use groupby and aggregation to answer concrete questions about a dataset.']},
  {name:'Linear Regression',short:'REGRESSION',group:'machine',level:'Beginner',color:'#f0b88d',description:'Find the signal in the noise. Make your first predictions.',path:'python_libs/06_linear_regression/01-linear-regression.html',art:'regression',objectives:['Model a numeric target as a weighted sum of input features and an intercept.','Fit a line by minimizing prediction error, such as mean squared error.','Evaluate on held-out data and inspect residuals to understand model limitations.']},
  {name:'Decision Trees & Forests',short:'TREES',group:'machine',level:'Intermediate',color:'#99d5a7',description:'Follow the branches from simple decisions to powerful models.',path:'python_libs/14_dec_tree/index.html',art:'tree',objectives:['A decision tree splits data using feature thresholds to form progressively more similar groups.','Tree depth and minimum sample settings help control overfitting.','Random forests combine many varied trees to produce more stable predictions.']},
  {name:'Clustering & Discovery',short:'K-MEANS',group:'machine',level:'Intermediate',color:'#ccaae8',description:'Discover hidden constellations in unlabeled data.',path:'python_libs/17_kmean/index.html',art:'cluster',objectives:['Clustering groups observations by similarity without labeled targets.','K-means alternates between assigning points to their nearest center and updating centers.','Scale features thoughtfully and compare different values of K; clusters need interpretation.']},
  {name:'Dimensionality Reduction',short:'PCA',group:'machine',level:'Advanced',color:'#84cddf',description:'Reveal what matters. Explore complex data in fewer dimensions.',path:'python_libs/18_pca/index.html',art:'pca',objectives:['Principal component analysis finds orthogonal directions of high variance in the data.','Project observations onto a smaller set of components for visualization or compression.','Use explained variance to assess information retained, and consider standardizing features first.']}
];
const cardTitles = [
 'Artificial Neural<br>Networks (ANN)',
 'Convolutional Neural<br>Networks (CNN)',
 'Recurrent Neural<br>Networks (RNN) & More',
 'NumPy & Numerical<br>Computing',
 'Pandas & Data<br>Exploration',
 'Linear<br>Regression',
 'Decision Trees<br>& Forests',
 'Clustering<br>& Discovery',
 'Dimensionality<br>Reduction (PCA)'
];
const cardDescriptions = [
 'Build and train foundational deep learning models.',
 'Master computer vision and image recognition techniques.',
 'Sequence modeling, NLP, and advanced AI techniques.',
 'Master arrays, vectors, and fast numerical operations.',
 'Clean, transform, and explore real-world datasets.',
 'Learn to model relationships and predict numerical outcomes.',
 'Explore branching decisions and ensemble learning.',
 'Find hidden patterns and groups in unlabeled data.',
 'Simplify complex data while preserving what matters.'
];
const grid=document.querySelector('#course-grid');
function render(filter='all'){
 const shown=topics.filter(t=>filter==='all'||t.group===filter);
 grid.innerHTML=shown.map(t=>{
  const index=topics.indexOf(t);
  return `<article class="course-card" style="--art-x:${(index%3)*50}%;--art-y:${Math.floor(index/3)*50}%"><div class="badge-frame"><div class="badge-rim"><div class="card-inner"><div class="card-art" aria-hidden="true"></div><h3>${cardTitles[index]}</h3><p>${cardDescriptions[index]}</p><div class="card-bottom"><span class="level">${t.level}</span><button class="explore" data-topic="${index}" aria-label="Explore ${t.name}">EXPLORE COURSE</button></div></div></div></div></article>`;
 }).join('');
 document.querySelector('#course-count').textContent=`${shown.length} missions to discover`;
}
render();
document.querySelectorAll('[data-filter]').forEach(button=>button.addEventListener('click',()=>{document.querySelectorAll('[data-filter]').forEach(b=>{b.classList.toggle('selected',b===button);b.setAttribute('aria-pressed',String(b===button))});render(button.dataset.filter)}));
const dialog=document.querySelector('#course-dialog');
grid.addEventListener('click',e=>{const button=e.target.closest('[data-topic]');if(!button)return;const t=topics[Number(button.dataset.topic)];document.querySelector('#dialog-label').textContent=`MISSION ${String(Number(button.dataset.topic)+1).padStart(2,'0')} / ${t.level.toUpperCase()}`;document.querySelector('#dialog-title').textContent=t.name;document.querySelector('#dialog-description').textContent=t.description;document.querySelector('#dialog-objectives').innerHTML=t.objectives.map(o=>`<li>${o}</li>`).join('');document.querySelector('#dialog-resource').innerHTML=t.path?`<a class="launch" href="${t.path}">OPEN INTERACTIVE LESSON ↗</a>`:'<p>The full interactive lesson for this frontier is not available yet. Build your foundations with the neural network lab.</p><a class="launch" href="advanced_ai/01_ann/index.html">EXPLORE NEURAL NETWORKS ↗</a>';dialog.showModal()});
document.querySelector('.close-dialog').addEventListener('click',()=>dialog.close());
dialog.addEventListener('click',e=>{if(e.target===dialog){const r=dialog.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)dialog.close()}});
const menu=document.querySelector('.menu-toggle'),nav=document.querySelector('#navigation');
function closeMenu(){nav.classList.remove('open');menu.setAttribute('aria-expanded','false')}
menu.addEventListener('click',()=>{const open=nav.classList.toggle('open');menu.setAttribute('aria-expanded',String(open))});
nav.addEventListener('click',e=>{if(e.target.closest('a'))closeMenu()});
document.addEventListener('keydown',e=>{if(e.key==='Escape'){closeMenu()}});
const observer=new IntersectionObserver(entries=>{entries.forEach(entry=>{if(entry.isIntersecting)document.querySelectorAll('nav a').forEach(a=>{const active=a.hash===`#${entry.target.id}`;a.classList.toggle('active',active);if(active)a.setAttribute('aria-current','location');else a.removeAttribute('aria-current')})})},{rootMargin:'-15% 0px -55% 0px'});
document.querySelectorAll('main>section').forEach(section=>observer.observe(section));
const canvas=document.querySelector('#stars'),ctx=canvas.getContext('2d'),motion=document.querySelector('#motion'),media=matchMedia('(prefers-reduced-motion: reduce)');let paused=media.matches,raf=0,last=0,width=0,height=0;const stars=Array.from({length:75},()=>({x:Math.random(),y:Math.random(),r:Math.random()*1.2+.25,speed:Math.random()*.012+.004}));
function resize(){width=canvas.clientWidth;height=canvas.clientHeight;const ratio=Math.min(devicePixelRatio||1,2);canvas.width=width*ratio;canvas.height=height*ratio;ctx.setTransform(ratio,0,0,ratio,0,0);draw(0)}
function draw(dt){ctx.clearRect(0,0,width,height);stars.forEach(s=>{if(!paused)s.x=(s.x+s.speed*dt)%1;ctx.beginPath();ctx.fillStyle=`rgba(196,231,255,${.3+s.r*.3})`;ctx.arc(s.x*width,s.y*height,s.r,0,Math.PI*2);ctx.fill()})}
function frame(time){draw(Math.min((time-last)/1000,.05));last=time;raf=requestAnimationFrame(frame)}
function syncMotion(){document.body.classList.toggle('paused',paused);motion.setAttribute('aria-pressed',String(paused));motion.textContent=paused?'▷ Play motion':'Ⅱ Pause motion';cancelAnimationFrame(raf);if(!paused&&!document.hidden){last=performance.now();raf=requestAnimationFrame(frame)}}
motion.addEventListener('click',()=>{paused=!paused;syncMotion()});media.addEventListener('change',e=>{paused=e.matches;syncMotion()});document.addEventListener('visibilitychange',syncMotion);window.addEventListener('resize',resize);resize();syncMotion();
