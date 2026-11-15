import * as T from 'three';
/** Soft contact shade without shadow maps, additional lights or textures. */
export function contactMaterial(){return new T.ShaderMaterial({transparent:true,depthWrite:false,uniforms:{opacity:{value:.25}},vertexShader:`varying vec2 vUv;void main(){vUv=uv;vec4 p=vec4(position,1.);
#ifdef USE_INSTANCING
p=instanceMatrix*p;
#endif
gl_Position=projectionMatrix*modelViewMatrix*p;}`,fragmentShader:`varying vec2 vUv;uniform float opacity;void main(){float r=length((vUv-.5)*2.);gl_FragColor=vec4(.06,.13,.09,(1.-smoothstep(.12,1.,r))*opacity);}`});}
