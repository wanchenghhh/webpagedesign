import * as THREE from './vendor/three.module.js';

// A single renderer shares a continuous camera scene and bounded chapter viewports.
export function createExperience(canvas,{stage,anchors,glyphAnchor,relationSlots}) {
  const renderer=new THREE.WebGLRenderer({canvas,alpha:true,antialias:true,powerPreference:'high-performance'});
  renderer.setPixelRatio(Math.min(devicePixelRatio||1,1.5));
  renderer.outputColorSpace=THREE.SRGBColorSpace;
  renderer.toneMapping=THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure=1.15;
  renderer.autoClear=false;
  const opening=new THREE.Scene(),camera=new THREE.PerspectiveCamera(42,1,.06,90);
  const envCanvas=document.createElement('canvas');envCanvas.width=512;envCanvas.height=256;
  const brush=envCanvas.getContext('2d'),wash=brush.createLinearGradient(0,0,0,256);
  wash.addColorStop(0,'#25334f');wash.addColorStop(.3,'#b19b6e');wash.addColorStop(.43,'#f4ead5');wash.addColorStop(.5,'#26314b');wash.addColorStop(.65,'#121c32');wash.addColorStop(.81,'#a28b58');wash.addColorStop(1,'#141d31');
  brush.fillStyle=wash;brush.fillRect(0,0,512,256);
  brush.fillStyle='#fff5d8';brush.fillRect(95,20,30,110);brush.fillRect(360,50,12,120);
  const env=new THREE.CanvasTexture(envCanvas);env.mapping=THREE.EquirectangularReflectionMapping;
  const pmrem=new THREE.PMREMGenerator(renderer),environment=pmrem.fromEquirectangular(env);
  opening.environment=environment.texture;env.dispose();pmrem.dispose();
  opening.add(new THREE.HemisphereLight(0xc5d5ef,0x413421,2));
  const key=new THREE.DirectionalLight(0xffe4aa,3.3);key.position.set(-3,5,7);opening.add(key);
  const rim=new THREE.DirectionalLight(0xb4ceef,2.4);rim.position.set(5,-2,4);opening.add(rim);
  const metal=new THREE.MeshStandardMaterial({color:0xbfa16a,metalness:.92,roughness:.28});
  const darkMetal=new THREE.MeshStandardMaterial({color:0x5b4c33,metalness:.9,roughness:.42,side:THREE.DoubleSide});
  const fineGold=new THREE.LineBasicMaterial({color:0xcfb479,transparent:true,opacity:.5});
  const wheel=new THREE.Group();opening.add(wheel);wheel.rotation.set(.24,-.13,.03);
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
  const outer=ring(3.12,.42,5,144),middle=ring(2.49,.17,2,96),inner=ring(1.85,.16,-.5,72);
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

  wheel.position.y=1.12;
  const radialCanvas=document.createElement('canvas');radialCanvas.width=radialCanvas.height=128;
  const rc=radialCanvas.getContext('2d'),rg=rc.createRadialGradient(64,64,0,64,64,64);
  rg.addColorStop(0,'#fff9df');rg.addColorStop(.07,'#ffefbd');rg.addColorStop(.2,'#e9c57e80');rg.addColorStop(.6,'#b18d3a10');rg.addColorStop(1,'#98732900');rc.fillStyle=rg;rc.fillRect(0,0,128,128);
  const glowTexture=new THREE.CanvasTexture(radialCanvas);
  function halo(size,color=0xffdca0,opacity=.75){
    const sprite=new THREE.Sprite(new THREE.SpriteMaterial({map:glowTexture,color,transparent:true,opacity,depthWrite:false,blending:THREE.AdditiveBlending}));
    sprite.scale.set(size,size,1);return sprite;
  }
  function orb(radius,color=0xffd891){return new THREE.Mesh(new THREE.SphereGeometry(radius,32,24),new THREE.MeshStandardMaterial({color,metalness:.65,roughness:.3}));}
  function trace(points,opacity=.6,color=0xd6b478){return new THREE.Line(new THREE.BufferGeometry().setFromPoints(points),new THREE.LineBasicMaterial({color,transparent:true,opacity}));}
  function curve(fn,count=160){return Array.from({length:count+1},(_,i)=>fn(i/count*Math.PI*2));}
  const planetGroups=[],planetParts=[];
  const solarMaterial=new THREE.ShaderMaterial({
    uniforms:{uTime:{value:0},uTint:{value:new THREE.Color(0xffcd68)}},
    vertexShader:'varying vec3 vP; varying vec3 vN; void main(){vP=position;vN=normalize(normalMatrix*normal);gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',
    fragmentShader:`varying vec3 vP;varying vec3 vN;uniform float uTime;uniform vec3 uTint;
    float n(vec3 p){return sin(p.x*13.+sin(p.y*17.+uTime*.24))*sin(p.y*11.+p.z*16.+uTime*.32);}
    void main(){float cloud=n(vP)+.5*n(vP*2.2)+.2*n(vP*5.);float light=.62+.3*max(vN.z,0.);float edge=pow(1.-max(vN.z,0.),2.);
    vec3 color=mix(vec3(.35,.105,.012),uTint,.60+cloud*.17)*light+vec3(1.,.55,.12)*edge*.5;gl_FragColor=vec4(color,1.);}`
  });
  const sunGroup=new THREE.Group();sunGroup.add(halo(6.3,0xffc97b,.4));
  const sun=new THREE.Mesh(new THREE.SphereGeometry(1.12,48,32),solarMaterial);sunGroup.add(sun);
  const corona=[];
  for(let i=0;i<3;i++){const c=circle(1.48+i*.18,0,.35-i*.08);sunGroup.add(c);corona.push(c);}
  const rayPoints=[];
  for(let i=0;i<64;i++){const a=i*Math.PI/32,r=1.27+i%3*.025;rayPoints.push(new THREE.Vector3(Math.sin(a)*r,Math.cos(a)*r,0),new THREE.Vector3(Math.sin(a)*(r+.18+(i%7)*.055),Math.cos(a)*(r+.18+(i%7)*.055),0));}
  sunGroup.add(new THREE.LineSegments(new THREE.BufferGeometry().setFromPoints(rayPoints),new THREE.LineBasicMaterial({color:0xf6d291,transparent:true,opacity:.6})));
  // Rising: a luminous half sun above a physical, tilted horizon.
  const risingGroup=new THREE.Group();risingGroup.add(halo(5.7,0xffde9e,.24));
  const risingSphere=new THREE.Mesh(new THREE.SphereGeometry(1.1,48,24,0,Math.PI*2,0,Math.PI/2),metal);risingSphere.position.y=-.25;risingGroup.add(risingSphere);
  const risingArch=trace(Array.from({length:101},(_,i)=>new THREE.Vector3(Math.cos(i/100*Math.PI)*1.42,Math.sin(i/100*Math.PI)*1.42-.25,0)),.7);risingGroup.add(risingArch);
  const horizon=new THREE.Group();risingGroup.add(horizon);horizon.position.y=-.25;
  for(let i=0;i<7;i++){const line=trace([new THREE.Vector3(-1.65+i*.12,-i*.13,0),new THREE.Vector3(1.65-i*.12,-i*.13,0)],.58-i*.05);horizon.add(line);}
  for(let i=0;i<11;i++){const a=i/10*Math.PI;const l=trace([new THREE.Vector3(Math.cos(a)*1.55,Math.sin(a)*1.55-.25,0),new THREE.Vector3(Math.cos(a)*1.85,Math.sin(a)*1.85-.25,0)],.6);risingGroup.add(l);}
  horizon.rotation.x=.4;
  // Moon texture is generated once; no remote maps or models.
  const moonCanvas=document.createElement('canvas');moonCanvas.width=512;moonCanvas.height=256;
  const mc=moonCanvas.getContext('2d');mc.fillStyle='#a8a7a2';mc.fillRect(0,0,512,256);
  let seed=104729;const random=()=>{seed=(seed*1664525+1013904223)>>>0;return seed/4294967296;};
  for(let i=0;i<700;i++){const x=random()*512,y=random()*256,r=1+random()*13;const c=mc.createRadialGradient(x-r*.2,y-r*.2,1,x,y,r);c.addColorStop(0,'#545c6745');c.addColorStop(.65,'#7a7d8340');c.addColorStop(.82,'#e4dfcb55');c.addColorStop(1,'#b5b4af00');mc.fillStyle=c;mc.fillRect(x-r,y-r,r*2,r*2);}
  const moonTexture=new THREE.CanvasTexture(moonCanvas);moonTexture.colorSpace=THREE.SRGBColorSpace;
  const moonGroup=new THREE.Group();const moon=new THREE.Mesh(new THREE.SphereGeometry(1.12,48,32),new THREE.MeshStandardMaterial({map:moonTexture,bumpMap:moonTexture,bumpScale:.07,roughness:.96,color:0xbac0d0}));moonGroup.add(moon);
  const shade=new THREE.Mesh(new THREE.SphereGeometry(1.125,48,32),new THREE.ShaderMaterial({transparent:true,depthWrite:false,vertexShader:'varying vec3 vP; void main(){vP=position;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',fragmentShader:'varying vec3 vP;void main(){float a=smoothstep(-.65,.4,vP.x+vP.z*.5);gl_FragColor=vec4(.018,.03,.06,a*.94);}'}));moonGroup.add(shade);
  const moonOrbit=circle(1.73,0,.35);moonOrbit.rotation.set(.4,-.55,.2);moonGroup.add(moonOrbit);
  const moonStar=halo(.65,0xe3eeff,.8);moonStar.position.set(1.38,-.83,.2);moonGroup.add(moonStar);
  [risingGroup,sunGroup,moonGroup].forEach((group,i)=>{group.position.set((i-1)*4.1,0,-20);opening.add(group);planetGroups.push(group);planetParts.push({scale:1,hover:0});});
  const tunnelPts=new Float32Array(180*6);
  for(let i=0;i<180;i++){const a=i*2.39996,r=3.5+random()*9,z=14-random()*38;tunnelPts.set([Math.sin(a)*r,Math.cos(a)*r,z,Math.sin(a)*r,Math.cos(a)*r,z-.45-random()*1.1],i*6);}
  const tunnel=new THREE.LineSegments(new THREE.BufferGeometry().setAttribute('position',new THREE.BufferAttribute(tunnelPts,3)),new THREE.LineBasicMaterial({color:0xf7dda0,transparent:true,opacity:0}));opening.add(tunnel);
  // Zodiac glyph targets are rasterized once on demand, then reused by a fixed pool.
  const glyphScene=new THREE.Scene(),glyphCamera=new THREE.PerspectiveCamera(38,1,.1,30);glyphCamera.position.z=6;
  const glyphGroup=new THREE.Group();glyphScene.add(glyphGroup);
  const COUNT=750,glyphPositions=new Float32Array(COUNT*3),glyphFrom=new Float32Array(COUNT*3),glyphTarget=new Float32Array(COUNT*3),glyphCache=new Map();
  const glyphGeometry=new THREE.BufferGeometry().setAttribute('position',new THREE.BufferAttribute(glyphPositions,3));
  const glyphMaterial=new THREE.ShaderMaterial({transparent:true,depthWrite:false,blending:THREE.AdditiveBlending,uniforms:{uOpacity:{value:0},uSize:{value:5}},
    vertexShader:'uniform float uSize;void main(){vec4 p=modelViewMatrix*vec4(position,1.);gl_PointSize=uSize*(6./-p.z);gl_Position=projectionMatrix*p;}',
    fragmentShader:'uniform float uOpacity;void main(){float r=length(gl_PointCoord-.5);float a=smoothstep(.5,.07,r);gl_FragColor=vec4(1.,.82,.42,a*uOpacity);}'});
  glyphGroup.add(new THREE.Points(glyphGeometry,glyphMaterial));
  const glyphPulse=new THREE.Mesh(new THREE.TorusGeometry(1.1,.008,6,128),new THREE.MeshBasicMaterial({color:0xe8c883,transparent:true,opacity:0}));glyphGroup.add(glyphPulse);
  const glyphCore=halo(3,0xffd787,0);glyphGroup.add(glyphCore);
  const symbols=['♈︎','♉︎','♊︎','♋︎','♌︎','♍︎','♎︎','♏︎','♐︎','♑︎','♒︎','♓︎'];
  function targets(index){
    if(glyphCache.has(index))return glyphCache.get(index);
    const c=document.createElement('canvas');c.width=c.height=220;const b=c.getContext('2d',{willReadFrequently:true});b.font='172px Georgia, serif';b.textAlign='center';b.textBaseline='middle';b.fillStyle='#fff';b.fillText(symbols[index],110,118);
    const data=b.getImageData(0,0,220,220).data,points=[];
    for(let y=10;y<210;y+=2)for(let x=10;x<210;x+=2)if(data[(y*220+x)*4+3]>140)points.push([(x-110)/62,(110-y)/62]);
    const out=new Float32Array(COUNT*3);
    for(let i=0;i<COUNT;i++){const pt=points[Math.floor(i/COUNT*points.length)]||[0,0];out.set([pt[0]+(random()-.5)*.018,pt[1]+(random()-.5)*.018,(random()-.5)*.1],i*3);}
    glyphCache.set(index,out);return out;
  }
  let glyphStart=-Infinity,glyphIndex=-1;
  function awaken(index,rotation=0){
    const active=performance.now()-glyphStart<2400;
    for(let i=0;i<COUNT;i++){
      const a=(index*30+15+rotation-90)*Math.PI/180+(random()-.5)*.4,r=1.3+random()*1.4;
      glyphFrom.set(active?glyphPositions.subarray(i*3,i*3+3):[Math.cos(a)*r,Math.sin(a)*r,(random()-.5)*2],i*3);
    }
    glyphTarget.set(targets(index));glyphIndex=index;glyphStart=performance.now();
    glyphAnchor.dataset.sign=String(index);glyphAnchor.dataset.phase='assembling';wake();
  }
  // Three distinct scene topologies, all live previews.
  const relations=relationSlots.map(()=>{const scene=new THREE.Scene();scene.environment=environment.texture;scene.add(new THREE.HemisphereLight(0xffe9bb,0x24314b,2.5));const l=new THREE.DirectionalLight(0xffdfaa,3);l.position.set(-3,4,5);scene.add(l);const group=new THREE.Group();scene.add(group);const camera=new THREE.PerspectiveCamera(34,1,.1,40);return{scene,group,camera,expand:0};});
  const twins=relations[0].group,twinstars=[],braids=[];
  [-1,1].forEach((side,i)=>{const node=new THREE.Group();node.position.x=side*1.15;node.add(orb(.38),halo(2.8,0xffd999,.75));twins.add(node);twinstars.push(node);});
  for(let k=0;k<2;k++){const braid=trace(curve(a=>new THREE.Vector3(Math.sin(a)*2,Math.sin(a*2)*.76,Math.cos(a*2+k*Math.PI)*.45)),k?.32:.72);braid.rotation.x=k?.3:-.2;twins.add(braid);braids.push(braid);}
  const twinDots=Array.from({length:8},()=>{const s=halo(.35,0xffe5aa,.8);twins.add(s);return s;});
  const network=relations[1].group,nodes=[];
  for(let i=0;i<5;i++){const a=i*Math.PI*2/5+.2;const p=new THREE.Vector3(Math.sin(a)*1.8,Math.cos(a)*1.65,Math.sin(a*2)*.6);nodes.push(p);const n=new THREE.Group();n.position.copy(p);n.add(orb(i?.12:.21),halo(i?.9:1.5,0xffe0a3,.9));network.add(n);}
  const filaments=[];
  nodes.forEach((a,i)=>nodes.forEach((b,j)=>{if(j<=i)return;const control=a.clone().add(b).multiplyScalar(.3);control.z+=.2+(i+j)%3*.2;const line=trace(new THREE.QuadraticBezierCurve3(a,control,b).getPoints(50),.3+(i+j)%3*.14);network.add(line);filaments.push(line);}));
  const self=relations[2].group;self.add(orb(.21),halo(3.7,0xffdf9c,.85));const iris=[];
  for(let i=0;i<7;i++){const ring=new THREE.Mesh(new THREE.TorusGeometry(.65+i*.19,.022,8,100),metal);ring.rotation.set(.15+i*.08,.1+i*.13,i*.3);self.add(ring);iris.push(ring);}
  const selfStars=trace(curve(a=>new THREE.Vector3(Math.cos(a)*2.05,Math.sin(a)*2.05,0)),.25);self.add(selfStars);
  let flight=0,selectedBody=-1,hoveredBody=-1,selectedRelation=-1,pointer={x:0,y:0},frame=0,last=0,frames=0,measure=performance.now(),pulse=0;
  const clamp=(v)=>Math.max(0,Math.min(1,v)),smooth=(v)=>{v=clamp(v);return v*v*(3-2*v);};
  const introStart=performance.now();
  let screenWidth=innerWidth,screenHeight=innerHeight;
  function resize(){screenWidth=innerWidth;screenHeight=innerHeight;renderer.setSize(screenWidth,screenHeight,false);wake();}
  function viewport(rect,scene,cam){
    if(rect.bottom<=0||rect.top>=screenHeight||rect.width<2||rect.height<2)return false;
    cam.aspect=rect.width/rect.height;cam.updateProjectionMatrix();
    const left=Math.max(0,rect.left),top=Math.max(0,rect.top),right=Math.min(screenWidth,rect.right),bottom=Math.min(screenHeight,rect.bottom);
    if(right<=left||bottom<=top)return false;
    renderer.setViewport(rect.left,screenHeight-rect.bottom,rect.width,rect.height);
    renderer.setScissor(left,screenHeight-bottom,right-left,bottom-top);
    renderer.clearDepth();renderer.render(scene,cam);return true;
  }
  function draw(now){
    frame=0;if(document.hidden)return;
    if(last&&now-last<15){frame=requestAnimationFrame(draw);return;}
    const dt=last?Math.min((now-last)/1000,.05):.016;last=now;
    renderer.setScissorTest(false);renderer.clear();renderer.setScissorTest(true);
    let active=false;
    const stageRect=stage.getBoundingClientRect();
    if(stageRect.bottom>0&&stageRect.top<screenHeight){
      active=true;camera.aspect=stageRect.width/stageRect.height;camera.updateProjectionMatrix();
      const travel=smooth(flight);camera.position.set(pointer.x*.035*(1-flight),1.12*Math.sin(Math.min(travel/.8,1)*Math.PI),18.6-24.6*travel);camera.lookAt(0,camera.position.y,-30);
      wheel.rotation.x=(.24+pointer.y*.08)*(1-smooth(flight/.5));wheel.rotation.y=(-.13+pointer.x*.12)*(1-smooth(flight/.5));
      const assembled=smooth((now-introStart)/1800);
      rings.forEach((ring,i)=>{ring.rotation.z=now*.00001*[1,-1.7,1.4][i]+(1-assembled)*(i+1)*-.6;ring.scale.setScalar(.05+assembled*.95);});
      const arrival=smooth((flight-.72)/.28),viewHeight=2*(20+camera.position.z)*Math.tan(21*Math.PI/180),viewWidth=viewHeight*camera.aspect;
      planetGroups.forEach((group,i)=>{
        const rect=anchors[i].getBoundingClientRect(),x=((rect.left+rect.width/2-stageRect.left)/stageRect.width-.5)*viewWidth,y=(.5-(rect.top+rect.height/2-stageRect.top)/stageRect.height)*viewHeight;
        group.position.x=THREE.MathUtils.lerp((i-1)*3.5,x,arrival);group.position.y=THREE.MathUtils.lerp(0,y,arrival);
        const desired=rect.height/stageRect.height*viewHeight/4.0*(i===selectedBody?1.05:1);
        const part=planetParts[i];part.scale+=(desired-part.scale)*Math.min(1,dt*7);part.hover+=((i===hoveredBody?1:0)-part.hover)*Math.min(1,dt*8);
        group.scale.setScalar(THREE.MathUtils.lerp(1,part.scale,arrival)*(1+part.hover*.065));group.rotation.y=Math.sin(now*.00012+i)*.1+pointer.x*.06*arrival;
        group.position.y+=Math.sin(now*.0008+i*2)*.07*arrival;group.visible=flight>.30;
      });
      solarMaterial.uniforms.uTime.value=now*.001;sun.rotation.y=now*.000045;
      corona.forEach((c,i)=>{const p=(now*.00016+i/3)%1;c.scale.setScalar(1+p*.45);c.material.opacity=(1-p)*.24;});
      moon.rotation.y=now*.000025;
      horizon.rotation.x=.3+Math.sin(now*.0006)*.12;
      tunnel.material.opacity=Math.sin(clamp((flight-.1)/.85)*Math.PI)*.65;
      viewport(stageRect,opening,camera);
    }
    const elapsed=(now-glyphStart)/1000;
    if(elapsed<2.4&&elapsed>=0){
      const r=glyphAnchor.getBoundingClientRect();
      if(r.bottom>0&&r.top<screenHeight){
        active=true;const gather=smooth(elapsed/.78),scatter=smooth((elapsed-1.5)/.9);
        for(let i=0;i<COUNT;i++)for(let j=0;j<3;j++){const k=i*3+j;glyphPositions[k]=THREE.MathUtils.lerp(glyphFrom[k],glyphTarget[k],gather)+scatter*(Math.sin(i*2.4+j)*2.8);}
        glyphGeometry.attributes.position.needsUpdate=true;glyphMaterial.uniforms.uOpacity.value=smooth(elapsed/.18)*(1-scatter);
        glyphMaterial.uniforms.uSize.value=4.3*renderer.getPixelRatio();
        glyphGroup.rotation.set(.06*Math.sin(elapsed*3),.18*Math.sin(elapsed*2),0);
        glyphPulse.scale.setScalar(.7+elapsed*.8);glyphPulse.material.opacity=Math.sin(clamp((elapsed-.4)/1.8)*Math.PI)*.45;
        glyphCore.material.opacity=Math.sin(clamp(elapsed/2.4)*Math.PI)*.12;
        glyphAnchor.dataset.phase=elapsed<.8?'assembling':elapsed<1.5?'holding':'dissolving';
        viewport(r,glyphScene,glyphCamera);
      }
    }else if(glyphIndex>=0)glyphAnchor.dataset.phase='idle';
    relationSlots.forEach((slot,i)=>{
      const r=slot.getBoundingClientRect();if(r.bottom<=0||r.top>=screenHeight)return;
      active=true;const relation=relations[i];relation.expand+=((selectedRelation===i?1:0)-relation.expand)*Math.min(1,dt*4);
      relation.camera.position.set(0,0,Math.max(8.5,3/(Math.tan(17*Math.PI/180)*(r.width/r.height))));
      relation.group.rotation.y=Math.sin(now*.00018+i)*.15+pointer.x*.05;
      relation.group.rotation.x=pointer.y*.04;relation.group.scale.setScalar(1.1+relation.expand*.25);
      if(i===0){twinstars.forEach((n,j)=>{n.position.x=(j?1:-1)*(1.12+Math.sin(now*.00065)*.08);n.position.y=Math.sin(now*.0005+j*Math.PI)*.22;});braids.forEach((b,j)=>b.rotation.z=Math.sin(now*.0002+j)*.12);twinDots.forEach((s,j)=>{const a=now*.0004+j*Math.PI/4;s.position.set(Math.sin(a)*2,Math.sin(a*2)*.76,Math.cos(a*2)*.45);});}
      if(i===1){network.rotation.z=Math.sin(now*.00015)*.12;filaments.forEach((l,j)=>l.material.opacity=.2+(Math.sin(now*.001+j)+1)*.16);}
      if(i===2){iris.forEach((ring,j)=>{ring.rotation.y=.1+j*.13+Math.sin(now*.0004+j*.3)*(.12+relation.expand*.25);ring.rotation.x=.15+j*.08+relation.expand*Math.sin(j*.6)*.5;ring.position.z=Math.sin(j*.7)*relation.expand*.35;ring.rotation.z=now*.00006*(j%2?-1:1);});}
      viewport(r,relation.scene,relation.camera);
    });
    canvas.dataset.active=String(active);frames++;
    if(now-measure>1500){canvas.dataset.fps=String(Math.round(frames*1000/(now-measure)));frames=0;measure=now;}
    if(active)frame=requestAnimationFrame(draw);else last=0;
  }
  function wake(){if(!frame&&!document.hidden){last=0;frame=requestAnimationFrame(draw);}}
  canvas.addEventListener('webglcontextlost',e=>{e.preventDefault();cancelAnimationFrame(frame);frame=0;document.body.dataset.webgl='fallback';document.querySelector('.hero-instrument').classList.remove('is-ready');canvas.dataset.webgl='lost';});
  document.addEventListener('visibilitychange',()=>{cancelAnimationFrame(frame);frame=0;if(!document.hidden)wake();});
  resize();canvas.dataset.webgl='ready';document.body.dataset.webgl='ready';
  return{resize,wake,awaken,setFlight(p){flight=clamp(p);canvas.dataset.flight=flight.toFixed(3);wake();},setBody(i){selectedBody=i;wake();},setHover(i){hoveredBody=i;wake();},setRelation(i){selectedRelation=i;wake();},setPointer(x,y){pointer={x,y};wake();},dispose(){cancelAnimationFrame(frame);[opening,glyphScene,...relations.map(r=>r.scene)].forEach(s=>s.traverse(o=>{o.geometry?.dispose();if(o.material)(Array.isArray(o.material)?o.material:[o.material]).forEach(m=>m.dispose());}));environment.dispose();moonTexture.dispose();labelTexture.dispose();glowTexture.dispose();renderer.dispose();}};
}
