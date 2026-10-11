import * as THREE from './vendor/three.module.js';

// All geometry and textures are generated locally; no model or image download.
export function createHeroScene(canvas) {
  const renderer=new THREE.WebGLRenderer({canvas,alpha:true,antialias:true,powerPreference:'high-performance'});
  renderer.setPixelRatio(Math.min(devicePixelRatio||1,1.5));
  renderer.outputColorSpace=THREE.SRGBColorSpace;
  renderer.toneMapping=THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure=1.25;
  const scene=new THREE.Scene(),camera=new THREE.PerspectiveCamera(42,1,.1,60);
  camera.position.set(0,0,10.7);
  const envCanvas=document.createElement('canvas');envCanvas.width=512;envCanvas.height=256;
  const brush=envCanvas.getContext('2d'),wash=brush.createLinearGradient(0,0,0,256);
  wash.addColorStop(0,'#25334f');wash.addColorStop(.3,'#b19b6e');wash.addColorStop(.43,'#f4ead5');wash.addColorStop(.5,'#26314b');wash.addColorStop(.65,'#121c32');wash.addColorStop(.81,'#a28b58');wash.addColorStop(1,'#141d31');
  brush.fillStyle=wash;brush.fillRect(0,0,512,256);
  brush.fillStyle='#fff5d8';brush.fillRect(95,20,30,110);brush.fillRect(360,50,12,120);
  const env=new THREE.CanvasTexture(envCanvas);env.mapping=THREE.EquirectangularReflectionMapping;
  const pmrem=new THREE.PMREMGenerator(renderer),environment=pmrem.fromEquirectangular(env);
  scene.environment=environment.texture;env.dispose();pmrem.dispose();
  scene.add(new THREE.HemisphereLight(0xc5d5ef,0x413421,2));
  const key=new THREE.DirectionalLight(0xffe4aa,3.3);key.position.set(-3,5,7);scene.add(key);
  const rim=new THREE.DirectionalLight(0xb4ceef,2.4);rim.position.set(5,-2,4);scene.add(rim);
  const metal=new THREE.MeshStandardMaterial({color:0xbfa16a,metalness:.92,roughness:.28});
  const darkMetal=new THREE.MeshStandardMaterial({color:0x5b4c33,metalness:.9,roughness:.42});
  const fineGold=new THREE.LineBasicMaterial({color:0xcfb479,transparent:true,opacity:.5});
  const wheel=new THREE.Group();scene.add(wheel);wheel.rotation.set(.24,-.13,.03);
  const rings=[];
  function circle(radius,z,opacity=.7){const pts=Array.from({length:193},(_,i)=>new THREE.Vector3(Math.sin(i*Math.PI/96)*radius,Math.cos(i*Math.PI/96)*radius,z));const material=fineGold.clone();material.opacity=opacity;return new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts),material);}
  function ring(radius,band,z,segments){
    const group=new THREE.Group();group.position.z=z;wheel.add(group);
    const shape=new THREE.Shape();shape.absarc(0,0,radius,0,Math.PI*2,false);
    const hole=new THREE.Path();hole.absarc(0,0,radius-band,0,Math.PI*2,true);shape.holes.push(hole);
    const geometry=new THREE.ExtrudeGeometry(shape,{depth:.055,bevelEnabled:true,bevelSegments:2,steps:1,bevelSize:.012,bevelThickness:.012,curveSegments:96});
    const mesh=new THREE.Mesh(geometry,darkMetal);group.add(mesh);
    [radius,radius-band].forEach(r=>{const edge=new THREE.Mesh(new THREE.TorusGeometry(r,.017,6,160),metal);edge.position.z=.06;group.add(edge);});
    group.add(circle(radius-band*.28,.074,.65),circle(radius-band*.73,.074,.3));
    const ticks=new THREE.InstancedMesh(new THREE.BoxGeometry(.009,.08,.012),metal,segments);
    const dummy=new THREE.Object3D();
    for(let i=0;i<segments;i++){const a=i/segments*Math.PI*2,r=radius-.08;dummy.position.set(Math.sin(a)*r,Math.cos(a)*r,.08);dummy.rotation.z=-a;dummy.scale.y=i%8===0?1.6:i%2===0?1:.5;dummy.updateMatrix();ticks.setMatrixAt(i,dummy.matrix);}
    group.add(ticks);rings.push(group);return group;
  }
  const outer=ring(3.12,.42,-.18,144),middle=ring(2.49,.17,.02,96),inner=ring(1.85,.16,.27,72);
  const labelCanvas=document.createElement('canvas');labelCanvas.width=labelCanvas.height=2048;
  const labelBrush=labelCanvas.getContext('2d'),glyphs=['♈︎','♉︎','♊︎','♋︎','♌︎','♍︎','♎︎','♏︎','♐︎','♑︎','♒︎','♓︎'];
  const names=['ARIES','TAURUS','GEMINI','CANCER','LEO','VIRGO','LIBRA','SCORPIO','SAGITTARIUS','CAPRICORN','AQUARIUS','PISCES'];
  labelBrush.fillStyle='#dbc38c';labelBrush.strokeStyle='#c9ae7555';labelBrush.lineWidth=1.3;labelBrush.textAlign='center';labelBrush.textBaseline='middle';
  for(let i=0;i<12;i++){
    const a=(i+.5)*Math.PI/6,r=895;
    labelBrush.save();labelBrush.translate(1024+Math.sin(a)*r,1024-Math.cos(a)*r);labelBrush.rotate(a);labelBrush.font='44px Georgia, serif';labelBrush.fillText(glyphs[i],0,-13);labelBrush.font='13px Arial';labelBrush.fillText(names[i],0,22);labelBrush.restore();
    const b=i*Math.PI/6;labelBrush.beginPath();labelBrush.moveTo(1024+Math.sin(b)*843,1024-Math.cos(b)*843);labelBrush.lineTo(1024+Math.sin(b)*963,1024-Math.cos(b)*963);labelBrush.stroke();
  }
  const labelTexture=new THREE.CanvasTexture(labelCanvas);labelTexture.colorSpace=THREE.SRGBColorSpace;labelTexture.anisotropy=Math.min(renderer.capabilities.getMaxAnisotropy(),4);
  const labels=new THREE.Mesh(new THREE.PlaneGeometry(6.55,6.55),new THREE.MeshBasicMaterial({map:labelTexture,transparent:true,depthWrite:false,opacity:.95}));labels.position.z=.087;outer.add(labels);
  const constellation=new THREE.Group();wheel.add(constellation);constellation.position.z=.46;
  const nodes=[[-.15,1.43],[.65,1.03],[1.17,.38],[.82,-.29],[1.18,-1.04],[.31,-1.39],[-.26,-.74],[-1.07,-1.12],[-1.36,-.23],[-.67,.18],[-1.06,.92],[-.26,.76],[.13,.25],[.35,-.31]];
  const links=[[0,1],[1,2],[2,3],[3,4],[4,5],[5,6],[6,7],[7,8],[8,9],[9,10],[10,11],[11,0],[9,12],[12,3],[12,13],[13,6],[11,12]];
  const linePts=[];links.forEach(([a,b])=>linePts.push(new THREE.Vector3(...nodes[a],0),new THREE.Vector3(...nodes[b],0)));
  constellation.add(new THREE.LineSegments(new THREE.BufferGeometry().setFromPoints(linePts),new THREE.LineBasicMaterial({color:0xe6c78a,transparent:true,opacity:.65})));
  const bead=new THREE.InstancedMesh(new THREE.SphereGeometry(.027,8,8),new THREE.MeshBasicMaterial({color:0xffe2a6}),nodes.length),dummy=new THREE.Object3D();
  nodes.forEach(([x,y],i)=>{dummy.position.set(x,y,0);dummy.scale.setScalar(i%3?1:1.55);dummy.updateMatrix();bead.setMatrixAt(i,dummy.matrix);});constellation.add(bead);
  const glowCanvas=document.createElement('canvas');glowCanvas.width=glowCanvas.height=128;const glowBrush=glowCanvas.getContext('2d'),glow=glowBrush.createRadialGradient(64,64,0,64,64,64);
  glow.addColorStop(0,'#fff7dc');glow.addColorStop(.08,'#ffedbe');glow.addColorStop(.25,'#d7b47266');glow.addColorStop(1,'#d7b47200');glowBrush.fillStyle=glow;glowBrush.fillRect(0,0,128,128);
  glowBrush.fillStyle='#fff1c9';glowBrush.beginPath();[[64,14],[69,59],[114,64],[69,69],[64,114],[59,69],[14,64],[59,59]].forEach(([x,y],i)=>i?glowBrush.lineTo(x,y):glowBrush.moveTo(x,y));glowBrush.closePath();glowBrush.fill();
  const glowTexture=new THREE.CanvasTexture(glowCanvas),core=new THREE.Sprite(new THREE.SpriteMaterial({map:glowTexture,transparent:true,depthWrite:false,blending:THREE.AdditiveBlending}));core.scale.set(1.05,1.05,1);core.position.z=.65;wheel.add(core);
  const orbits=new THREE.Group();wheel.add(orbits);
  for(let i=0;i<2;i++){const orbit=circle(3.65+i*.13,0,.23);orbit.rotation.x=i?.59:-.49;orbit.rotation.y=i?.45:-.23;orbit.rotation.z=i?.4:-.4;orbits.add(orbit);}
  const satellite=new THREE.Mesh(new THREE.SphereGeometry(.09,16,16),metal);satellite.position.set(-3.5,1.06,.3);orbits.add(satellite);
  const satelliteGlow=new THREE.Sprite(new THREE.SpriteMaterial({map:glowTexture,transparent:true,opacity:.45,depthWrite:false,blending:THREE.AdditiveBlending}));satelliteGlow.position.copy(satellite.position);satelliteGlow.scale.set(.65,.65,1);orbits.add(satelliteGlow);
  const particles=new Float32Array(150*3);for(let i=0;i<150;i++){const a=i*2.39996,r=3.4+(i%23)/23*1.6;particles[i*3]=Math.sin(a)*r;particles[i*3+1]=Math.cos(a)*r;particles[i*3+2]=-1-(i%17)/5;}
  const particleGeometry=new THREE.BufferGeometry();particleGeometry.setAttribute('position',new THREE.BufferAttribute(particles,3));const dust=new THREE.Points(particleGeometry,new THREE.PointsMaterial({color:0xd6c39c,size:.018,transparent:true,opacity:.55}));scene.add(dust);
  let progress=0,pointer={x:0,y:0},visible=true,frame=0,lastTime=0,frames=0,measureTime=0,pulseStrength={value:0},introduced=false;
  const intro=window.gsap.timeline({onComplete:()=>{introduced=true;canvas.dataset.intro='complete';}});
  rings.forEach((group,i)=>{group.scale.setScalar(.02);group.position.z+=i*.75;intro.to(group.scale,{x:1,y:1,z:1,duration:1.65,ease:'power3.out'},i*.25).to(group.position,{z:[-.18,.02,.27][i],duration:1.8,ease:'power2.out'},i*.25);});
  intro.from(wheel.rotation,{z:-.8,duration:2.5,ease:'power3.out'},0).from(constellation.scale,{x:.05,y:.05,z:.05,duration:1.8,ease:'power3.out'},.65).from(orbits.scale,{x:.3,y:.3,z:.3,duration:2,ease:'power2.out'},.4);
  function resize(){const w=canvas.clientWidth,h=canvas.clientHeight;if(!w||!h)return;renderer.setSize(w,h,false);camera.aspect=w/h;camera.updateProjectionMatrix();}
  function draw(time){frame=0;if(!visible||document.hidden)return;if(lastTime&&time-lastTime<15){frame=requestAnimationFrame(draw);return;}const dt=lastTime?Math.min((time-lastTime)/1000,.05):.016;lastTime=time;
    wheel.rotation.x+=(.24+pointer.y*.08-wheel.rotation.x)*.055;wheel.rotation.y+=(-.13+pointer.x*.12-wheel.rotation.y)*.055;
    if(introduced){outer.rotation.z+=dt*.012;middle.rotation.z-=dt*.025;inner.rotation.z+=dt*.017;constellation.rotation.z-=dt*.009;wheel.position.y=Math.sin(time*.00042)*.055;}
    camera.position.z=10.7-progress*9.1;camera.position.y=progress*.07;camera.lookAt(0,0,0);
    const coreScale=1.02+Math.sin(time*.0011)*.09+pulseStrength.value;core.scale.set(coreScale,coreScale,1);core.material.opacity=.78+Math.sin(time*.0012)*.12;dust.rotation.z=time*.000012;
    renderer.render(scene,camera);frames++;if(time-measureTime>1500){canvas.dataset.fps=String(Math.round(frames*1000/(time-measureTime)));frames=0;measureTime=time;}
    frame=requestAnimationFrame(draw);
  }
  resize();renderer.render(scene,camera);frame=requestAnimationFrame(draw);
  canvas.dataset.intro='playing';canvas.dataset.webgl='ready';
  return {
    resize,setProgress(value){progress=Math.min(1,Math.max(0,value));},setPointer(x,y){pointer={x,y};},
    setVisible(value){visible=value;canvas.dataset.active=String(value);if(value&&!frame){lastTime=0;measureTime=performance.now();frames=0;frame=requestAnimationFrame(draw);}else if(!value){cancelAnimationFrame(frame);frame=0;}},
    pulse(){window.gsap.killTweensOf(pulseStrength);window.gsap.fromTo(pulseStrength,{value:.9},{value:0,duration:1.7,ease:'power2.out'});},
    dispose(){cancelAnimationFrame(frame);intro.kill();scene.traverse(obj=>{obj.geometry?.dispose();if(obj.material)(Array.isArray(obj.material)?obj.material:[obj.material]).forEach(m=>m.dispose());});environment.dispose();labelTexture.dispose();glowTexture.dispose();renderer.dispose();}
  };
}
