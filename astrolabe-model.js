import * as THREE from './vendor/three.module.js';

const SIGNS=['♈︎','♉︎','♊︎','♋︎','♌︎','♍︎','♎︎','♏︎','♐︎','♑︎','♒︎','♓︎'];
const ROMAN=['I','II','III','IV','V','VI','VII','VIII','IX','X','XI','XII'];
const TAU=Math.PI*2;
const ease=v=>{v=THREE.MathUtils.clamp(v,0,1);return v*v*(3-2*v);};

// Original, procedural meshes. The aperture is geometry, not a painted image.
export function createAstrolabe({glowTexture}) {
  const group=new THREE.Group();group.name='AstrolabeRoot';
  const textures=[],rings=[],satellites=[],portals=[];
  const gold=new THREE.MeshStandardMaterial({color:0xd8b26c,metalness:.94,roughness:.23,envMapIntensity:1.7});
  const bronze=new THREE.MeshStandardMaterial({color:0x977037,metalness:.88,roughness:.36,envMapIntensity:1.5});
  const paleGold=new THREE.MeshStandardMaterial({color:0xf1d5a1,metalness:.92,roughness:.2,envMapIntensity:1.8});
  const darkGold=new THREE.MeshStandardMaterial({color:0x4b3920,metalness:.85,roughness:.43,envMapIntensity:1.4});
  const ornament=new THREE.Group();ornament.name='GimbalAndFinials';group.add(ornament);
  let seed=49297;
  const random=()=>{seed=(seed*1664525+1013904223)>>>0;return seed/4294967296;};

  function texture(canvas,color=true) {
    const t=new THREE.CanvasTexture(canvas);
    if(color)t.colorSpace=THREE.SRGBColorSpace;
    t.anisotropy=4;textures.push(t);return t;
  }
  function annulus(radius,width,depth,material) {
    const shape=new THREE.Shape();shape.absarc(0,0,radius,0,TAU,false);
    const hole=new THREE.Path();hole.absarc(0,0,radius-width,0,TAU,true);shape.holes.push(hole);
    const geometry=new THREE.ExtrudeGeometry(shape,{depth,steps:1,bevelEnabled:true,bevelSegments:3,bevelThickness:.024,bevelSize:.022,curveSegments:64});
    const position=geometry.attributes.position,uv=geometry.attributes.uv;
    for(let i=0;i<position.count;i++)uv.setXY(i,position.getX(i)/(radius*2)+.5,position.getY(i)/(radius*2)+.5);
    return new THREE.Mesh(geometry,material);
  }
  function rim(parent,radius,tube,z,material=gold) {
    const mesh=new THREE.Mesh(new THREE.TorusGeometry(radius,tube,8,128),material);
    mesh.position.z=z;parent.add(mesh);return mesh;
  }
  function faceMaps(radius,width,kind) {
    const canvas=document.createElement('canvas'),height=document.createElement('canvas');
    canvas.width=canvas.height=height.width=height.height=1024;
    const c=canvas.getContext('2d'),h=height.getContext('2d'),center=512,r=512;
    const inner=(radius-width)/radius*r;
    const wash=c.createRadialGradient(center,center,inner,center,center,r);
    const tones=kind===0?['#2e261c','#665132','#423320']:kind===1?['#997542','#c7a364','#795936']:['#a17d44','#d5af6d','#916c35'];
    wash.addColorStop(0,tones[0]);wash.addColorStop(.46,tones[1]);wash.addColorStop(1,tones[2]);
    c.fillStyle=wash;c.fillRect(0,0,1024,1024);h.fillStyle='#c3c3c3';h.fillRect(0,0,1024,1024);
    // A fixed grain seed makes the brushed surface reproducible across reloads.
    for(let i=0;i<1100;i++){
      const rr=inner+random()*(r-inner),a=random()*TAU;
      c.strokeStyle=i%2?'#fff2cb12':'#2b1c111b';c.lineWidth=.4+random()*.7;
      c.beginPath();c.arc(center,center,rr,a,a+.008+random()*.07);c.stroke();
    }
    function circle(rr,color,line=1){c.strokeStyle=color;c.lineWidth=line;c.beginPath();c.arc(center,center,rr,0,TAU);c.stroke();h.strokeStyle='#888';h.lineWidth=line;h.beginPath();h.arc(center,center,rr,0,TAU);h.stroke();}
    [inner+10,inner+17,r-15,r-23].forEach((rr,i)=>circle(rr,i%2?'#e7ca88':'#4b351b',i%2?1.1:1.8));
    c.textAlign=h.textAlign='center';c.textBaseline=h.textBaseline='middle';
    const textRadius=(inner+r)/2;
    for(let i=0;i<12;i++){
      const a=(i+.5)/12*TAU,x=center+Math.sin(a)*textRadius,y=center-Math.cos(a)*textRadius;
      c.save();h.save();c.translate(x,y);h.translate(x,y);c.rotate(a);h.rotate(a);
      const font=kind===0?'51px Georgia, serif':kind===1?'32px Georgia, serif':'43px Georgia, serif';
      c.font=h.font=font;c.fillStyle='#342516';h.fillStyle='#242424';
      const text=kind===1?ROMAN[i]:SIGNS[(i+(kind===2?6:0))%12];
      c.fillText(text,0,1);h.fillText(text,0,1);
      c.fillStyle=kind===0?'#ead39e':'#5e4524';c.fillText(text,-.8,-.9);
      c.restore();h.restore();
      const a2=i/12*TAU;
      for(const context of [c,h]){context.strokeStyle=context===c?'#5a3b21':'#555';context.lineWidth=1.2;context.beginPath();context.moveTo(center+Math.sin(a2)*(inner+22),center-Math.cos(a2)*(inner+22));context.lineTo(center+Math.sin(a2)*(r-27),center-Math.cos(a2)*(r-27));context.stroke();}
      // Small rosettes and punched dots between each constellation sector.
      const px=center+Math.sin(a2)*(textRadius),py=center-Math.cos(a2)*(textRadius);
      c.fillStyle='#e4c28a';h.fillStyle='#444';
      c.beginPath();c.arc(px,py,3,0,TAU);c.fill();h.beginPath();h.arc(px,py,3,0,TAU);h.fill();
    }
    return {map:texture(canvas),bumpMap:texture(height,false)};
  }
  function studs(parent,radius,z,count,size=.047) {
    const mesh=new THREE.InstancedMesh(new THREE.SphereGeometry(size,10,8),paleGold,count);
    const dummy=new THREE.Object3D();
    for(let i=0;i<count;i++){const a=i/count*TAU;dummy.position.set(Math.sin(a)*radius,Math.cos(a)*radius,z);dummy.scale.set(1,1,.55);dummy.updateMatrix();mesh.setMatrixAt(i,dummy.matrix);}
    parent.add(mesh);
  }
  function ticks(parent,radius,z,count,length=.078) {
    const mesh=new THREE.InstancedMesh(new THREE.BoxGeometry(.008,length,.014),paleGold,count),dummy=new THREE.Object3D();
    for(let i=0;i<count;i++){const a=i/count*TAU;dummy.position.set(Math.sin(a)*radius,Math.cos(a)*radius,z);dummy.rotation.z=-a;dummy.scale.y=i%12===0?1.65:i%3===0?1:.47;dummy.updateMatrix();mesh.setMatrixAt(i,dummy.matrix);}
    parent.add(mesh);
  }
  function plate(name,radius,width,depth,z,kind) {
    const node=new THREE.Group();node.name=name;node.position.z=z;
    const maps=faceMaps(radius,width,kind);
    const face=new THREE.MeshStandardMaterial({color:0xffffff,...maps,bumpScale:.025,metalness:kind===0?.66:.86,roughness:kind===0?.51:.33,envMapIntensity:kind===0?1:1.5});
    node.add(annulus(radius,width,depth,[face,bronze]));
    const front=depth+.015;
    rim(node,radius-.006,.036,front,paleGold);rim(node,radius-width+.006,.036,front,gold);
    rim(node,radius-.092,.009,front+.015);rim(node,radius-width+.083,.01,front+.015);
    ticks(node,radius-.057,front+.008,kind===0?240:144,kind===0?.06:.04);
    studs(node,radius-.125,front+.024,24,.026);
    rings.push(node);group.add(node);return node;
  }
  const outer=plate('OuterRing',3.32,.46,.24,.14,0);
  const middle=plate('MiddleRing',2.80,.4,.20,.075,1);
  const inner=plate('InnerRing',2.34,.62,.26,.02,2);
  const back=annulus(3.46,.15,.15,[bronze,darkGold]);back.position.z=-.11;outer.add(back);
  rim(outer,3.46,.029,.04,paleGold);rim(outer,3.29,.024,-.13,bronze);
  studs(outer,3.39,.125,48,.039);
  // Bearings nest around the plate edges, giving the initial pose one silhouette.
  [0,Math.PI].forEach(a=>{
    const bearing=new THREE.Mesh(new THREE.SphereGeometry(.145,20,14),gold);
    bearing.scale.set(1.5,1,.55);bearing.position.set(Math.sin(a)*2.56,Math.cos(a)*2.56,.33);ornament.add(bearing);
  });
  function lathe(profile,material) {return new THREE.Mesh(new THREE.LatheGeometry(profile.map(p=>new THREE.Vector2(...p)),40),material);}
  function star(radius=.39) {
    const shape=new THREE.Shape();
    for(let i=0;i<16;i++){const a=i*Math.PI/8,r=i%2?.055:i%4===0?radius:radius*.43;const x=Math.sin(a)*r,y=Math.cos(a)*r*(i%4===0?1.35:1);if(i===0)shape.moveTo(x,y);else shape.lineTo(x,y);}
    shape.closePath();return new THREE.Mesh(new THREE.ExtrudeGeometry(shape,{depth:.062,steps:1,bevelEnabled:true,bevelSegments:2,bevelThickness:.016,bevelSize:.012}),[paleGold,bronze]);
  }
  const finialProfile=[[.10,0],[.14,.04],[.14,.1],[.065,.13],[.045,.25],[.16,.30],[.21,.34],[.16,.4],[.045,.43],[.042,.6],[.10,.67],[.12,.71],[.07,.76],[.035,.83]];
  [-1,1].forEach((side)=>{
    const node=new THREE.Group();node.name=side>0?'TopFinial':'BottomFinial';node.position.set(0,side*3.25,.06);
    if(side<0)node.rotation.z=Math.PI;
    node.add(lathe(finialProfile,gold));
    const jewel=star(side>0?.32:.21);jewel.position.set(0,.95,.015);node.add(jewel);
    const bracket=new THREE.Mesh(new THREE.BoxGeometry(.16,.52,.25),bronze);bracket.position.y=-.2;node.add(bracket);
    ornament.add(node);
  });
  // Curved metal ribbons and satellites occupy actual depth around the instrument.
  const orbits=[];
  [[4.12,1.14,.20,.28],[4.34,.90,-.43,-.24]].forEach(([radius,rx,ry,rz],index)=>{
    const orbit=new THREE.Group();orbit.name='Orbit_'+index;orbit.rotation.set(rx,ry,rz);orbit.position.z=-.16;
    const band=annulus(radius,.046,.027,[gold,bronze]);orbit.add(band);
    rim(orbit,radius-.021,.009,.034,paleGold);
    for(let i=0;i<5;i++){
      const size=i===0?.17:.07+(i%3)*.037;
      const satellite=new THREE.Mesh(new THREE.SphereGeometry(size,20,14),i%2?bronze:paleGold);
      const angle=i*TAU/5+index*.42;satellite.position.set(Math.cos(angle)*radius,Math.sin(angle)*radius,.06);orbit.add(satellite);
      satellites.push({mesh:satellite,radius,angle,speed:(index?-1:1)*(.025+i*.005)});
    }
    ornament.add(orbit);orbits.push(orbit);
  });
  // Fine meridian braces sit behind the plate rather than across the opening.
  const meridian=new THREE.Group();meridian.rotation.y=.47;meridian.position.z=-.26;
  rim(meridian,3.78,.025,0,bronze);rim(meridian,3.81,.009,0,paleGold);ornament.add(meridian);
  const beadGeo=new THREE.SphereGeometry(.032,8,6);
  const beadRail=new THREE.InstancedMesh(beadGeo,paleGold,72),dummy=new THREE.Object3D();
  for(let i=0;i<72;i++){const a=i/72*TAU;dummy.position.set(Math.cos(a)*3.78,Math.sin(a)*3.78,0);dummy.updateMatrix();beadRail.setMatrixAt(i,dummy.matrix);}
  meridian.add(beadRail);

  function glow(size,opacity,color=0xffddb1) {
    const sprite=new THREE.Sprite(new THREE.SpriteMaterial({map:glowTexture,color,transparent:true,opacity,depthWrite:false,blending:THREE.AdditiveBlending}));sprite.scale.set(size,size,1);return sprite;
  }
  const portal=new THREE.Group();portal.name='PortalHorizon';group.add(portal);
  const earthMaterial=new THREE.ShaderMaterial({transparent:true,uniforms:{uFade:{value:1},uTime:{value:0}},
    vertexShader:'varying vec3 vP;varying vec3 vN;void main(){vP=position;vN=normalize(normalMatrix*normal);gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',
    fragmentShader:`varying vec3 vP;varying vec3 vN;uniform float uFade;uniform float uTime;
      void main(){vec3 n=normalize(vN);float lands=sin(vP.x*7.+sin(vP.z*9.))*sin(vP.y*9.+vP.z*4.);float clouds=sin(vP.x*23.+vP.y*19.+uTime*.04)*sin(vP.z*17.-vP.y*11.);float rim=pow(1.-max(n.z,0.),3.);
      vec3 color=mix(vec3(.008,.024,.072),vec3(.035,.10,.16),smoothstep(.18,.7,lands));color+=max(clouds,0.)*.024; color+=vec3(.23,.48,.76)*rim*.9;float sunlight=exp(-pow(vP.x/.8,2.))*smoothstep(.35,.95,vP.y/3.2+.5);color+=vec3(.08,.06,.025)*sunlight;gl_FragColor=vec4(color,uFade);}`});
  const earth=new THREE.Mesh(new THREE.SphereGeometry(3.2,56,24,0,TAU,0,.95),earthMaterial);earth.position.set(0,-3.7,-4.7);portal.add(earth);portals.push(earthMaterial);
  const atmosphereMaterial=new THREE.ShaderMaterial({transparent:true,depthWrite:false,blending:THREE.AdditiveBlending,uniforms:{uFade:{value:1}},
    vertexShader:'varying vec3 vN;void main(){vN=normalize(normalMatrix*normal);gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',
    fragmentShader:'varying vec3 vN;uniform float uFade;void main(){float f=pow(1.-max(normalize(vN).z,0.),5.);gl_FragColor=vec4(.38,.65,.95,f*uFade*.38);}'});
  const atmosphere=new THREE.Mesh(new THREE.SphereGeometry(3.24,48,24,0,TAU,0,.95),atmosphereMaterial);atmosphere.position.copy(earth.position);portal.add(atmosphere);portals.push(atmosphereMaterial);
  const crescentMaterial=new THREE.ShaderMaterial({transparent:true,uniforms:{uFade:{value:1}},
    vertexShader:'varying vec3 vN;void main(){vN=normal;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',
    fragmentShader:'varying vec3 vN;uniform float uFade;void main(){float l=smoothstep(0.,.8,dot(normalize(vN),normalize(vec3(.94,.1,.05))));vec3 color=mix(vec3(.012,.025,.06),vec3(.76,.86,.97),l);gl_FragColor=vec4(color,uFade);}'});
  const crescent=new THREE.Mesh(new THREE.SphereGeometry(.31,32,20),crescentMaterial);crescent.position.set(.86,.53,-.84);portal.add(crescent);portals.push(crescentMaterial);
  const dawn=glow(1.1,.9);dawn.position.set(0,-.05,-.4);portal.add(dawn);
  const sunDot=new THREE.Mesh(new THREE.SphereGeometry(.047,16,12),new THREE.MeshBasicMaterial({color:0xffe9b8,transparent:true}));sunDot.position.copy(dawn.position);portal.add(sunDot);
  const glints=[];
  [[-2.6,2.1,.8],[2.7,-1.83,.75],[0,4.22,.35]].forEach(([x,y,size])=>{const s=glow(size,.3);s.position.set(x,y,.6);group.add(s);glints.push(s);});

  group.position.y=.94;
  function update({time,flight,pointer}) {
    const align=ease(flight/.38),spread=ease((flight-.13)/.32),fade=1-ease((flight-.12)/.19);
    group.visible=flight<.9;
    group.rotation.set((.09+pointer.y*.045)*(1-align),(-.24+pointer.x*.07)*(1-align),.014*(1-align));
    group.position.y=.94*(1-align);
    const starts=[.14,.075,.02],destinations=[5,1,-4.2],rates=[.013,-.019,.022];
    rings.forEach((node,i)=>{node.position.z=THREE.MathUtils.lerp(starts[i],destinations[i],spread);node.rotation.z=time*rates[i];});
    ornament.position.z=5*spread;ornament.visible=flight<.64;
    orbits[0].rotation.z=.28+Math.sin(time*.085)*.06;
    orbits[1].rotation.y=-.43+Math.sin(time*.065)*.09;
    satellites.forEach(({mesh,radius,angle,speed})=>mesh.position.set(Math.cos(angle+time*speed)*radius,Math.sin(angle+time*speed)*radius,.06));
    portal.visible=fade>0;portals.forEach(m=>m.uniforms.uFade.value=fade);earthMaterial.uniforms.uTime.value=time;
    dawn.material.opacity=fade*(.75+Math.sin(time*.9)*.1);sunDot.material.opacity=fade;
    glints.forEach((s,i)=>{s.material.opacity=(.18+Math.pow(Math.max(0,Math.sin(time*.65+i*2.1)),8)*.4)*(1-align);s.position.z=rings[0].position.z+.55;});
  }
  const stats={meshes:0,triangles:0};
  group.traverse(o=>{if(o.isMesh){stats.meshes++;const n=(o.geometry.index?.count??o.geometry.attributes.position.count)/3;stats.triangles+=n*(o.isInstancedMesh?o.count:1);}});
  return{group,update,stats,dispose(){textures.forEach(t=>t.dispose());}};
}
