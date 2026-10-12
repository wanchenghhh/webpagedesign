(() => {
  'use strict';
  const gsap=window.gsap;
  history.scrollRestoration='manual';
  gsap.registerPlugin(window.ScrollTrigger);
  let experience=null,flight=0;
  const signs = [
    { name:'白羊座', en:'Aries', symbol:'♈', intro:'热情勇敢，喜欢用行动开启新的可能。' },
    { name:'金牛座', en:'Taurus', symbol:'♉', intro:'稳重踏实，在熟悉的节奏里感受生活之美。' },
    { name:'双子座', en:'Gemini', symbol:'♊', intro:'好奇灵活，善于在交流中发现新鲜视角。' },
    { name:'巨蟹座', en:'Cancer', symbol:'♋', intro:'敏感温柔，珍惜情感联结与内心的归属。' },
    { name:'狮子座', en:'Leo', symbol:'♌', intro:'自信热忱，乐于表达自己，也愿意照亮他人。' },
    { name:'处女座', en:'Virgo', symbol:'♍', intro:'细致认真，习惯用专注把想法变得更完善。' },
    { name:'天秤座', en:'Libra', symbol:'♎', intro:'温和友善，重视关系中的平衡与和谐。' },
    { name:'天蝎座', en:'Scorpio', symbol:'♏', intro:'专注深刻，习惯循着直觉探索内心深处。' },
    { name:'射手座', en:'Sagittarius', symbol:'♐', intro:'乐观自由，总对远方与未知保持好奇。' },
    { name:'摩羯座', en:'Capricorn', symbol:'♑', intro:'务实坚定，愿意用耐心让目标一步步实现。' },
    { name:'水瓶座', en:'Aquarius', symbol:'♒', intro:'独立创新，喜欢用不同的视角看待世界。' },
    { name:'双鱼座', en:'Pisces', symbol:'♓', intro:'感性浪漫，拥有丰富的想象与细腻的共情。' }
  ];
  signs.forEach(sign => { sign.symbol += '\uFE0E'; });
  const point = (radius, degrees) => {
    const angle = (degrees - 90) * Math.PI / 180;
    return [300 + radius * Math.cos(angle), 300 + radius * Math.sin(angle)];
  };
  const xy = p => p.map(n => n.toFixed(2)).join(' ');
  function sector(start, end, inner, outer) {
    const a = point(outer,start), b=point(outer,end), c=point(inner,end), d=point(inner,start);
    return `M${xy(a)} A${outer} ${outer} 0 0 1 ${xy(b)} L${xy(c)} A${inner} ${inner} 0 0 0 ${xy(d)} Z`;
  }

  function chartMarkup(){
    const zones=signs.map((sign,i)=>`<path class="zodiac-zone ${i===7?'is-active':''}" data-sign="${i}" d="${sector(i*30,i*30+30,58,287)}" role="button" tabindex="0" aria-label="点亮${sign.name}" aria-pressed="${i===7}"/>`).join('');
    // Reveal the reference artwork itself so its stars and lines always align.
    return `<span class="wheel-orbit" aria-hidden="true"></span><span class="wheel-orbit second" aria-hidden="true"></span><div class="wheel-turn"><img class="wheel-art" src="assets/reference-chart-wheel.webp" width="2000" height="2000" alt="金色十二星座星盘" loading="lazy" decoding="async"><svg class="wheel-highlight" viewBox="0 0 600 600" aria-hidden="true"><defs><clipPath id="selected-constellation-clip" clipPathUnits="userSpaceOnUse"><path d="${sector(210,240,103,244)}"/></clipPath></defs><image class="selected-constellation" href="assets/reference-chart-wheel.webp" width="600" height="600" clip-path="url(#selected-constellation-clip)"/></svg><svg class="wheel-zones" viewBox="0 0 600 600" aria-label="十二星座，可用键盘或鼠标点亮"><defs><radialGradient id="wheel-wash" gradientUnits="userSpaceOnUse" cx="300" cy="300" r="287"><stop offset="18%" stop-color="#d5b875" stop-opacity="0"/><stop offset="65%" stop-color="#e5c891" stop-opacity=".18"/><stop offset="100%" stop-color="#d5b875" stop-opacity=".04"/></radialGradient></defs>${zones}</svg></div>`;
  }
  const heroChart=document.querySelector('#hero-chart');heroChart.innerHTML=chartMarkup()+'<span class="glyph-anchor" aria-hidden="true"></span>';
  let selected=7,awakening=false,birthdaySequence=null,resumeWheel=null;
  const wheelTurn=heroChart.querySelector('.wheel-turn');
  const constellationHighlight=heroChart.querySelector('.selected-constellation');
  let wheelLoop=gsap.to(wheelTurn,{rotation:'+=360',duration:240,repeat:-1,ease:'none',paused:true});
  function startWheelRotation(){
    wheelLoop?.kill();
    wheelLoop=gsap.to(wheelTurn,{rotation:'+=360',duration:240,repeat:-1,ease:'none',paused:!screens[2].classList.contains('is-active')||document.hidden});
  }
  function highlightHero(index){
    selected=index;heroChart.dataset.selected=String(index);
    heroChart.querySelectorAll('.zodiac-zone[data-sign]').forEach(el=>{const active=Number(el.dataset.sign)===index;el.classList.toggle('is-active',active);el.setAttribute('aria-pressed',String(active));});
    document.querySelector('.sign-symbol').textContent=signs[index].symbol;document.querySelector('.sign-name').textContent=signs[index].name;
    document.querySelector('.sign-intro').textContent=signs[index].intro;
    heroChart.querySelector('#selected-constellation-clip path').setAttribute('d',sector(index*30,index*30+30,103,244));
    constellationHighlight.dataset.sign=String(index);
  }
  function illuminate(index,rotate=false){
    birthdaySequence?.kill();resumeWheel?.kill();gsap.killTweensOf(wheelTurn);wheelLoop?.kill();wheelLoop=null;awakening=rotate;
    document.querySelector('.hero-art').classList.toggle('is-generating',rotate);
    highlightHero(index);
    gsap.set(constellationHighlight,{opacity:0});
    const current=Number(gsap.getProperty(wheelTurn,'rotation'))||0;
    experience?.awaken(index,current);
    const delta=((-(index*30+15)-current)%360+540)%360-180;
    heroChart.dataset.turn=delta.toFixed(1);
    birthdaySequence=gsap.timeline({onComplete:()=>{
      awakening=false;document.querySelector('.hero-art').classList.remove('is-generating');
      if(rotate)resumeWheel=gsap.delayedCall(3,startWheelRotation);
    }});
    if(rotate)birthdaySequence.to(wheelTurn,{rotation:current+delta,duration:1.35,ease:'power3.inOut'});
    else startWheelRotation();
    birthdaySequence.to(constellationHighlight,{opacity:1,duration:.7,ease:'power2.out'},rotate?.9:0).to(constellationHighlight,{opacity:.6,duration:1.1,ease:'sine.inOut'});
  }
  heroChart.querySelectorAll('.zodiac-zone[data-sign]').forEach(el=>{
    // Keep the selected caption stable while the wheel passes under the cursor.
    el.addEventListener('focus',()=>{if(!awakening)illuminate(Number(el.dataset.sign));});
    el.addEventListener('click',()=>illuminate(Number(el.dataset.sign)));
    el.addEventListener('keydown',event=>{if(event.key==='Enter'||event.key===' '){event.preventDefault();illuminate(Number(el.dataset.sign));}});
  });
  highlightHero(7);

  const observatory=document.querySelector('.observatory'),bodyItems=[...document.querySelectorAll('[data-body-item]')],bodyButtons=[...document.querySelectorAll('[data-body]')],bodyDetail=document.querySelector('.celestial-detail');
  const bodyCopy=[
    ['ASCENDANT / THE WAY YOU MEET THE WORLD','上升星座','你的第一印象、外在表达，以及面对新环境的方式。它是你与世界相遇时，最先被看见的那束光。'],
    ['SUN / THE LIGHT AT YOUR CORE','太阳星座','关于自我认同、表达意愿，以及你希望发光的方向。在你心里，总有一个想要成为的自己。'],
    ['MOON / THE FEELINGS WITHIN','月亮星座','关于情绪、安全感，以及亲近关系中的内在需求。那些温柔而隐秘的感受，也组成了完整的你。']
  ];
  let activeBody=-1;
  function selectBody(index){
    activeBody=activeBody===index?-1:index;
    observatory.classList.toggle('has-selection',activeBody>=0);observatory.dataset.selected=String(activeBody);
    const others=bodyItems.map((_,i)=>i).filter(i=>i!==activeBody);
    bodyItems.forEach((item,i)=>{item.classList.toggle('is-selected',i===activeBody);item.classList.toggle('is-secondary-right',activeBody>=0&&i===others[1]);bodyButtons[i].setAttribute('aria-expanded',String(i===activeBody));});
    gsap.killTweensOf(bodyDetail);
    if(activeBody>=0){
      bodyDetail.hidden=false;bodyDetail.querySelector('.detail-en').textContent=bodyCopy[activeBody][0];bodyDetail.querySelector('.detail-title').textContent=bodyCopy[activeBody][1];bodyDetail.querySelector('.detail-copy').textContent=bodyCopy[activeBody][2];
      gsap.fromTo(bodyDetail,{opacity:0,x:25},{opacity:1,x:0,duration:.65,delay:.25,ease:'power2.out'});
    }else bodyDetail.hidden=true;
    experience?.setBody(activeBody);
  }
  bodyButtons.forEach((button,i)=>{button.addEventListener('click',()=>selectBody(i));button.addEventListener('pointerenter',()=>experience?.setHover(i));button.addEventListener('pointerleave',()=>experience?.setHover(-1));});
  bodyDetail.querySelector('button').addEventListener('click',()=>{const previous=activeBody;selectBody(previous);bodyButtons[previous]?.focus({preventScroll:true});});
  observatory.addEventListener('keydown',event=>{if(event.key==='Escape'&&activeBody>=0)bodyDetail.querySelector('button').click();});

  const birthday=document.querySelector('#birthday'),today=new Date();
  birthday.max=`${today.getFullYear()}-${String(today.getMonth()+1).padStart(2,'0')}-${String(today.getDate()).padStart(2,'0')}`;
  // This prototype uses common calendar ranges, not astronomical natal calculations.
  function signForDate(month,day) {
    const mmdd=month*100+day;
    if(mmdd>=321&&mmdd<=419)return 0;
    if(mmdd>=420&&mmdd<=520)return 1;
    if(mmdd>=521&&mmdd<=621)return 2;
    if(mmdd>=622&&mmdd<=722)return 3;
    if(mmdd>=723&&mmdd<=822)return 4;
    if(mmdd>=823&&mmdd<=922)return 5;
    if(mmdd>=923&&mmdd<=1023)return 6;
    if(mmdd>=1024&&mmdd<=1122)return 7;
    if(mmdd>=1123&&mmdd<=1221)return 8;
    if(mmdd>=1222||mmdd<=119)return 9;
    if(mmdd>=120&&mmdd<=218)return 10;
    return 11;
  }

  document.querySelector('#birthday-form').addEventListener('submit',event=>{
    event.preventDefault();const error=document.querySelector('#birthday-error');
    if(!birthday.value||!birthday.validity.valid){error.textContent='请选择 1900 年至今天之间的有效出生日期。';birthday.setAttribute('aria-invalid','true');birthday.focus();return;}
    const [year,month,day]=birthday.value.split('-').map(Number),date=new Date(year,month-1,day);
    if(date.getFullYear()!==year||date.getMonth()!==month-1||date.getDate()!==day){error.textContent='这个日期不存在，请重新选择。';birthday.setAttribute('aria-invalid','true');return;}
    error.textContent='';birthday.removeAttribute('aria-invalid');const index=signForDate(month,day);
    document.querySelector('.result-name').textContent=signs[index].name;document.querySelector('.result-symbol').textContent=signs[index].symbol;
    illuminate(index,true);gsap.fromTo('.birthday-result',{y:9,opacity:.3},{y:0,opacity:1,duration:.65});
  });
  birthday.addEventListener('input',()=>{document.querySelector('#birthday-error').textContent='';birthday.removeAttribute('aria-invalid');});

  const relationWorlds=document.querySelector('.relationship-worlds'),relationPanels=[...document.querySelectorAll('.relationship-panel')];
  let activeRelation=-1;
  function selectRelation(index){
    activeRelation=activeRelation===index?-1:index;relationWorlds.classList.toggle('has-selection',activeRelation>=0);relationWorlds.dataset.selected=String(activeRelation);
    relationPanels.forEach((panel,i)=>{const selected=i===activeRelation;panel.classList.toggle('is-selected',selected);panel.setAttribute('aria-expanded',String(selected));panel.querySelector('.relation-action').firstChild.textContent=selected?'收起这个宇宙 ':'展开这个宇宙 ';});
    experience?.setRelation(activeRelation);
  }
  relationPanels.forEach((panel,i)=>{panel.addEventListener('click',()=>selectRelation(i));panel.addEventListener('keydown',event=>{const key=event.key;let next=i;if(key==='ArrowRight'||key==='ArrowDown')next=(i+1)%3;else if(key==='ArrowLeft'||key==='ArrowUp')next=(i+2)%3;else if(key==='Home')next=0;else if(key==='End')next=2;else if(key==='Escape'&&activeRelation>=0){selectRelation(activeRelation);return;}else return;event.preventDefault();relationPanels[next].focus({preventScroll:true});});});

  const canvas=document.querySelector('#starfield'),ctx=canvas.getContext('2d');
  const hero=document.querySelector('.immersive-hero');
  const heroCanvas=document.querySelector('#hero-stars'),heroContext=heroCanvas.getContext('2d');
  let stars=[],width=0,height=0,frame=0,resizeTimer;
  function paintHeroSky() {
    if(!heroContext)return;
    const w=heroCanvas.clientWidth,h=heroCanvas.clientHeight,scale=Math.min(devicePixelRatio||1,1.25);
    heroCanvas.width=Math.round(w*scale);heroCanvas.height=Math.round(h*scale);
    heroContext.setTransform(scale,0,0,scale,0,0);
    heroContext.fillStyle='#080e1d';heroContext.fillRect(0,0,w,h);
    let seed=117;
    const random=()=>{seed=(seed*1664525+1013904223)>>>0;return seed/4294967296;};
    const normal=()=>Math.sqrt(-2*Math.log(Math.max(random(),.001)))*Math.cos(random()*Math.PI*2);
    // The dense galaxy is rasterized only on resize, then moved as a single layer.
    for(let i=0;i<100;i++) {
      const x=random()*w,y=h*(.7-.55*x/w)+normal()*h*.12,r=20+random()*80;
      const cloud=heroContext.createRadialGradient(x,y,0,x,y,r);
      cloud.addColorStop(0,`rgba(${i%3?95:154},${i%3?108:128},${i%3?145:110},.065)`);cloud.addColorStop(1,'rgba(8,14,29,0)');
      heroContext.fillStyle=cloud;heroContext.fillRect(x-r,y-r,r*2,r*2);
    }
    const count=Math.min(5800,Math.round(w*h/210));
    for(let i=0;i<count;i++) {
      const band=i%3!==0,x=random()*w,y=band?h*(.7-.55*x/w)+normal()*h*.105:random()*h;
      const r=random()<.98?.2+random()*.7:1+random()*.8;
      heroContext.globalAlpha=.12+random()*.52;heroContext.fillStyle=i%5?'#ccd3e4':'#d9be90';
      heroContext.beginPath();heroContext.arc(x,y,r,0,Math.PI*2);heroContext.fill();
    }
    heroContext.globalAlpha=.65;heroContext.strokeStyle='#cfbb97';heroContext.lineWidth=.5;
    [[.12,.2],[.83,.18],[.67,.77],[.29,.66],[.92,.61]].forEach(([x,y])=>{
      heroContext.beginPath();heroContext.moveTo(w*x-6,h*y);heroContext.lineTo(w*x+6,h*y);heroContext.moveTo(w*x,h*y-9);heroContext.lineTo(w*x,h*y+9);heroContext.stroke();
    });
    heroContext.globalAlpha=1;
  }
  function sizeStars() {
    width=innerWidth;height=innerHeight;
    const scale=Math.min(devicePixelRatio||1,1.5);
    canvas.width=Math.round(width*scale);canvas.height=Math.round(height*scale);ctx?.setTransform(scale,0,0,scale,0,0);
    stars=Array.from({length:Math.min(85,Math.round(width/20))},()=>({x:Math.random()*width,y:Math.random()*height,r:Math.random()*.9+.25,phase:Math.random()*Math.PI*2,speed:Math.random()*.0003+.00015}));
    paintHeroSky();
  }
  function paintStars(time=0) {
    if(!ctx)return;
    ctx.clearRect(0,0,width,height);
    stars.forEach(star=>{ctx.globalAlpha=.14+(Math.sin(time*star.speed+star.phase)+1)*.2;ctx.fillStyle='#d7c6a6';ctx.beginPath();ctx.arc(star.x,star.y,star.r,0,Math.PI*2);ctx.fill();});
    ctx.globalAlpha=1;
  }
  function animateStars(time) {paintStars(time);if(!document.hidden)frame=requestAnimationFrame(animateStars);else frame=0;}
  document.addEventListener('visibilitychange',()=>{cancelAnimationFrame(frame);frame=0;if(!document.hidden)frame=requestAnimationFrame(animateStars);});
  window.addEventListener('resize',()=>{clearTimeout(resizeTimer);resizeTimer=setTimeout(()=>{sizeStars();paintStars();},120);},{passive:true});

  const screens=['top','product','zodiac','connection','within'].map(id=>document.getElementById(id)),markers=[],entries=[1,0,0,0,0],covers=[0,0,0,0,0];
  let activeIndex=0;
  const seamWords=['','Written in your stars','Under the same sky','Look within'];
  screens.forEach((screen,index)=>{
    screen.classList.add('chapter');screen.style.setProperty('--screen-order',index+1);
    if(index===1){markers.push(null);return;}
    const marker=document.createElement('div');marker.className='chapter-marker';marker.dataset.chapter=String(index);screen.before(marker);markers.push(marker);
    if(index>1){const seam=document.createElement('div');seam.className='section-seam';seam.setAttribute('aria-hidden','true');seam.innerHTML=`<span class="seam-word">${seamWords[index-1]}</span><svg class="seam-constellation" viewBox="0 0 280 150"><path d="M16 122 71 83 125 105 171 37 219 65 262 15"/><g><circle cx="16" cy="122" r="2"/><circle cx="71" cy="83" r="3"/><circle cx="125" cy="105" r="2"/><circle cx="171" cy="37" r="3"/><circle cx="219" cy="65" r="2"/><circle cx="262" cy="15" r="3"/></g></svg>`;screen.prepend(seam);}
  });
  const chapterCount=document.createElement('div');chapterCount.className='chapter-count';chapterCount.setAttribute('aria-hidden','true');document.querySelector('nav').append(chapterCount);
  function syncMotion(){
    const arrival=Math.max(0,Math.min(1,(flight-.77)/.2));entries[1]=arrival;covers[0]=flight;
    hero.style.setProperty('--flight',flight.toFixed(4));screens[1].style.setProperty('--arrival',arrival.toFixed(4));
    activeIndex=flight>.84?1:0;
    screens.forEach((screen,i)=>{
      const active=i===0?hero.getBoundingClientRect().bottom>0:entries[i]>.08&&covers[i]<.99;
      screen.style.setProperty('--entry',entries[i].toFixed(4));screen.style.setProperty('--cover',covers[i].toFixed(4));screen.classList.toggle('is-active',active);
      screen.inert=i===0?false:entries[i]<.1||covers[i]>.99;
      if(i>=2&&entries[i]>.55&&covers[i]<.55)activeIndex=i;
    });
    document.querySelector('.hero-frame').inert=flight>.22;
    document.querySelector('.scroll-cue').inert=flight>.22;
    chapterCount.innerHTML=`0${activeIndex+1} <span>/ 05</span>`;
    document.querySelectorAll('.site-header nav a').forEach((a,i)=>a.classList.toggle('is-current',i===0?activeIndex===1:activeIndex===2));
    experience?.setFlight(flight);
    if(!awakening&&wheelLoop)wheelLoop.paused(!screens[2].classList.contains('is-active')||document.hidden);
    drawJourney();
  }
  function fitScreens(){
    document.body.classList.toggle('screen-stack',innerWidth>700);
    screens.forEach(screen=>screen.style.setProperty('--screen-top',`${Math.min(0,innerHeight-screen.offsetHeight)}px`));
  }
  function chapterY(index){return index===1?hero.offsetTop+hero.offsetHeight-document.querySelector('.hero-stage').offsetHeight:markers[Math.max(0,index)].getBoundingClientRect().top+scrollY;}
  fitScreens();
  let layoutTimer=0;
  function refreshLayout(){layoutTimer=0;fitScreens();experience?.resize();sizeJourney();ScrollTrigger.refresh();syncMotion();}
  window.addEventListener('resize',()=>{clearTimeout(layoutTimer);layoutTimer=setTimeout(refreshLayout,150);},{passive:true});
  document.addEventListener('visibilitychange',syncMotion);
  window.addEventListener('scroll',()=>experience?.wake(),{passive:true});
  document.querySelectorAll('a[href^="#"]').forEach(link=>link.addEventListener('click',event=>{
    const id=link.getAttribute('href').slice(1),target=document.getElementById(id);if(!target)return;
    event.preventDefault();const section=target.closest('section'),index=id==='main'?0:screens.indexOf(section);
    if(layoutTimer){clearTimeout(layoutTimer);refreshLayout();}
    window.scrollTo({top:chapterY(index),behavior:'smooth'});
    history.replaceState(null,'',`#${id}`);
    if(id==='your-sky')setTimeout(()=>birthday.focus({preventScroll:true}),800);
  }));

  const journeyCanvas=document.querySelector('#journey-field'),journey=journeyCanvas.getContext('2d');
  let journeyWidth=0,journeyHeight=0,journeyRAF=0;
  function sizeJourney(){journeyWidth=innerWidth;journeyHeight=innerHeight;const dpr=Math.min(devicePixelRatio||1,1.25);journeyCanvas.width=Math.round(journeyWidth*dpr);journeyCanvas.height=Math.round(journeyHeight*dpr);journey.setTransform(dpr,0,0,dpr,0,0);}
  function glowPoint(x,y,r,alpha){journey.globalAlpha=alpha;journey.fillStyle='#ffedc0';journey.beginPath();journey.arc(x,y,r,0,Math.PI*2);journey.fill();}
  function drawJourney(){
    if(!journeyWidth)return;if(journeyRAF)return;
    journeyRAF=requestAnimationFrame(()=>{journeyRAF=0;journey.clearRect(0,0,journeyWidth,journeyHeight);
      const transition=covers.findIndex((p,i)=>i>0&&p>.02&&p<.98);if(transition<0)return;
      const p=covers[transition],w=journeyWidth,h=journeyHeight,alpha=Math.sin(p*Math.PI)*.58;
      journey.lineWidth=.8;journey.strokeStyle='#d5bb80';journey.shadowColor='#d5b477';journey.shadowBlur=8;
      if(transition===0){
        const r=(.07+p*p*1.5)*Math.min(w,h);journey.globalAlpha=alpha*.45;journey.beginPath();journey.ellipse(w*.5,h*.44,r,r*.83,0,0,Math.PI*2);journey.stroke();
        for(let i=0;i<3;i++){const targetX=w*(.22+i*.28),x=w*.5+(targetX-w*.5)*p,y=h*.44+(h*.69-h*.44)*p;journey.globalAlpha=alpha;journey.beginPath();journey.moveTo(w*.5,h*.44);journey.quadraticCurveTo(x,h*.22,x,y);journey.stroke();glowPoint(x,y,2.6,alpha);}
      }else{
        const start=transition===1?[[.22,.45],[.5,.35],[.78,.45]]:transition===2?[[.49,.46],[.53,.5],[.46,.54]]:[[.27,.5],[.43,.5],[.53,.5]];
        const end=transition===1?[.49,.52]:transition===2?[.3,.48]:[.5,.39];
        start.forEach(([sx,sy],i)=>{const ex=end[0]+(i-1)*.018,ey=end[1],t=p,x=(sx+(ex-sx)*t)*w,y=(sy+(ey-sy)*t)*h-Math.sin(p*Math.PI)*(i-1)*h*.16;journey.globalAlpha=alpha*.65;journey.beginPath();journey.moveTo(sx*w,sy*h);journey.quadraticCurveTo((sx+ex)*w*.5,(sy+ey)*h*.5-h*.1,x,y);journey.stroke();glowPoint(x,y,2.3,alpha);});
        for(let i=0;i<18;i++){const a=i*2.4,r=(1-p)*Math.min(w,h)*(.11+i%4*.03);glowPoint(end[0]*w+Math.sin(a)*r,end[1]*h+Math.cos(a)*r,1+i%3*.3,alpha*.6);}
      }
      journey.shadowBlur=0;journey.globalAlpha=1;
    });
  }
  sizeJourney();

  const brandCanvas=document.querySelector('#brand-stars'),brandBrush=brandCanvas.getContext('2d'),brandParticles=[];
  const outline=[[0,-.36],[.065,-.065],[.36,0],[.065,.065],[0,.36],[-.065,.065],[-.36,0],[-.065,-.065]];
  for(let i=0;i<80;i++){const segment=Math.floor(i/10),t=(i%10)/10,a=outline[segment],b=outline[(segment+1)%8];brandParticles.push({x:a[0]+(b[0]-a[0])*t,y:a[1]+(b[1]-a[1])*t,sx:Math.sin(i*2.4)*(.25+i%7*.05),sy:Math.cos(i*2.4)*(.25+i%7*.05),phase:i*.8});}
  function sizeBrand(){const w=brandCanvas.clientWidth,h=brandCanvas.clientHeight,dpr=Math.min(devicePixelRatio||1,1.5);brandCanvas.width=Math.round(w*dpr);brandCanvas.height=Math.round(h*dpr);brandBrush.setTransform(dpr,0,0,dpr,0,0);}
  sizeBrand();window.addEventListener('resize',sizeBrand,{passive:true});
  gsap.ticker.add(time=>{
    if(!screens[4].classList.contains('is-active')||document.hidden)return;
    const w=brandCanvas.clientWidth,h=brandCanvas.clientHeight,p=Math.min(1,entries[4]*1.4);
    brandBrush.clearRect(0,0,w,h);brandBrush.fillStyle='#f8dba5';
    brandParticles.forEach(star=>{const x=w*(.5+star.sx*(1-p)+star.x*.55*p),y=h*(.5+star.sy*(1-p)+star.y*.55*p);brandBrush.globalAlpha=(.35+(Math.sin(time*1.5+star.phase)+1)*.25)*(1-p*.5);brandBrush.beginPath();brandBrush.arc(x,y,star.phase%3*.18+.65,0,Math.PI*2);brandBrush.fill();});brandBrush.globalAlpha=1;
  });
  const instrument=document.querySelector('.hero-instrument');
  import('./experience-scene.min.js?v=8').then(({createExperience})=>{
    try{
      experience=createExperience(document.querySelector('#experience-3d'),{stage:document.querySelector('.hero-stage'),anchors:[...document.querySelectorAll('.celestial-anchor')],glyphAnchor:document.querySelector('.glyph-anchor'),relationSlots:[...document.querySelectorAll('.relationship-scene')]});
      instrument.classList.add('is-ready');instrument.dataset.renderer='webgl';syncMotion();
    }catch(error){instrument.dataset.renderer='fallback';document.body.dataset.webgl='fallback';console.warn('宇宙场景使用轻量动态替代。',error.message);}
  }).catch(error=>{instrument.dataset.renderer='fallback';document.body.dataset.webgl='fallback';console.warn('宇宙场景暂不可用。',error.message);});
  window.addEventListener('pointermove',event=>{if(event.pointerType==='mouse')experience?.setPointer((event.clientX/innerWidth-.5)*2,(event.clientY/innerHeight-.5)*2);},{passive:true});

  // Cached sprites and a bounded particle pool keep the stardust cursor light.
  const cursorCanvas=document.querySelector('#stardust-cursor');
  const cursorContext=cursorCanvas.getContext('2d');
  const finePointer=matchMedia('(hover: hover) and (pointer: fine)');
  if(cursorContext&&finePointer.matches) {
    const sprite=document.createElement('canvas');sprite.width=sprite.height=64;
    const brush=sprite.getContext('2d');
    const glow=brush.createRadialGradient(32,32,0,32,32,30);
    glow.addColorStop(0,'rgba(255,250,227,1)');glow.addColorStop(.09,'rgba(249,229,178,.9)');glow.addColorStop(.3,'rgba(223,186,113,.23)');glow.addColorStop(1,'rgba(223,186,113,0)');
    brush.fillStyle=glow;brush.fillRect(0,0,64,64);
    brush.fillStyle='#fff7de';brush.beginPath();brush.moveTo(32,18);brush.lineTo(34,30);brush.lineTo(46,32);brush.lineTo(34,34);brush.lineTo(32,46);brush.lineTo(30,34);brush.lineTo(18,32);brush.lineTo(30,30);brush.closePath();brush.fill();
    let cursorWidth=innerWidth,cursorHeight=innerHeight,cursorFrame=0,lastTime=0;
    let pointerX=-100,pointerY=-100,headX=-100,headY=-100,inside=false,editing=false,hovering=false;
    let particles=[],ripples=[];
    function sizeCursor() {
      cursorWidth=innerWidth;cursorHeight=innerHeight;
      const scale=Math.min(devicePixelRatio||1,1.5);
      cursorCanvas.width=Math.round(cursorWidth*scale);cursorCanvas.height=Math.round(cursorHeight*scale);
      cursorContext.setTransform(scale,0,0,scale,0,0);
    }
    function wakeCursor(){if(!cursorFrame&&!document.hidden){lastTime=0;cursorFrame=requestAnimationFrame(drawCursor);}}
    function emitDust(x,y,count,burst=false) {
      for(let i=0;i<count;i++) {
        const angle=Math.random()*Math.PI*2,speed=burst?30+Math.random()*110:8+Math.random()*25;
        particles.push({x:x+(Math.random()-.5)*7,y:y+(Math.random()-.5)*7,vx:Math.cos(angle)*speed,vy:Math.sin(angle)*speed,age:0,life:burst?.65+Math.random()*.45:.35+Math.random()*.4,size:burst?6+Math.random()*13:4+Math.random()*9});
      }
      if(particles.length>110)particles.splice(0,particles.length-110);
    }
    function drawCursor(time) {
      cursorFrame=0;
      const dt=lastTime?Math.min((time-lastTime)/1000,.032):1/60;lastTime=time;
      const ease=1-Math.pow(.68,dt*60);
      headX+=(pointerX-headX)*ease;headY+=(pointerY-headY)*ease;
      cursorContext.clearRect(0,0,cursorWidth,cursorHeight);
      particles=particles.filter(p=>p.age<p.life);
      cursorContext.globalCompositeOperation='lighter';
      particles.forEach(p=>{
        p.age+=dt;p.x+=p.vx*dt;p.y+=p.vy*dt;p.vy+=10*dt;
        cursorContext.globalAlpha=Math.max(0,1-p.age/p.life)*.75;
        cursorContext.drawImage(sprite,p.x-p.size/2,p.y-p.size/2,p.size,p.size);
      });
      ripples=ripples.filter(r=>r.age<.6);
      ripples.forEach(r=>{r.age+=dt;cursorContext.globalAlpha=Math.max(0,1-r.age/.6)*.5;cursorContext.strokeStyle='#e9cf9d';cursorContext.lineWidth=.8;cursorContext.beginPath();cursorContext.arc(r.x,r.y,5+r.age*55,0,Math.PI*2);cursorContext.stroke();});
      if(inside&&!editing) {
        const size=hovering?44:34;
        cursorContext.globalAlpha=1;cursorContext.drawImage(sprite,headX-size/2,headY-size/2,size,size);
      }
      cursorContext.globalAlpha=1;cursorContext.globalCompositeOperation='source-over';
      if(particles.length||ripples.length||(inside&&Math.hypot(pointerX-headX,pointerY-headY)>.15))cursorFrame=requestAnimationFrame(drawCursor);
    }
    window.addEventListener('pointermove',event=>{
      if(event.pointerType!=='mouse')return;
      const distance=Math.hypot(event.clientX-pointerX,event.clientY-pointerY);
      if(!inside){headX=event.clientX;headY=event.clientY;}
      pointerX=event.clientX;pointerY=event.clientY;inside=true;
      editing=Boolean(event.target.closest('input,textarea,[contenteditable="true"]'));
      hovering=Boolean(event.target.closest('a,button,[role="button"]'));
      document.body.classList.add('stardust-active');
      if(distance>2&&!editing)emitDust(pointerX,pointerY,Math.min(4,Math.ceil(distance/9)));
      wakeCursor();
    },{passive:true});
    window.addEventListener('pointerdown',event=>{
      if(event.pointerType!=='mouse'||event.target.closest('input,textarea'))return;
      emitDust(event.clientX,event.clientY,24,true);
      ripples.push({x:event.clientX,y:event.clientY,age:0});if(ripples.length>4)ripples.shift();wakeCursor();
    },{passive:true});
    const leaveCursor=()=>{inside=false;document.body.classList.remove('stardust-active');wakeCursor();};
    document.documentElement.addEventListener('pointerleave',leaveCursor);
    window.addEventListener('blur',leaveCursor);
    document.addEventListener('visibilitychange',()=>{cancelAnimationFrame(cursorFrame);cursorFrame=0;if(document.hidden)leaveCursor();else wakeCursor();});
    window.addEventListener('resize',()=>{sizeCursor();wakeCursor();},{passive:true});
    sizeCursor();
  }

  sizeStars();paintStars();if(!document.hidden)frame=requestAnimationFrame(animateStars);
  ScrollTrigger.create({trigger:hero,start:'top top',end:'bottom bottom',onUpdate:self=>{flight=self.progress;syncMotion();},onRefresh:self=>{flight=self.progress;}});
  markers.forEach((marker,i)=>{if(i<2)return;ScrollTrigger.create({trigger:marker,start:'top bottom',end:'top top',onUpdate:self=>{entries[i]=self.progress;covers[i-1]=self.progress;syncMotion();},onRefresh:self=>{entries[i]=self.progress;covers[i-1]=self.progress;}});});
  ScrollTrigger.refresh();syncMotion();
  document.body.dataset.motion='ready';
  window.addEventListener('pageshow',()=>{const target=document.getElementById(location.hash.slice(1));if(target){const index=screens.indexOf(target.closest('section'));if(index>=0)requestAnimationFrame(()=>{fitScreens();ScrollTrigger.refresh();window.scrollTo({top:chapterY(index),behavior:'instant'});syncMotion();});}});
})();
