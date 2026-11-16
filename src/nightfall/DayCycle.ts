import * as T from "three";
import type { NightState } from "./State";
export function dayPhase(time: number) {
  return time < .22 ? "Morgen" : time < .47 ? "Mittag" : time < .6 ? "Abend" : time < .68 ? "Sonnenuntergang" : time < .92 ? "Nacht" : "Sonnenaufgang";
}
export const isNight = (time: number) => time >= .68 && time < .92;
export function advanceDay(state: NightState, dt: number) {
  const wasNight = isNight(state.time);
  state.time = (state.time + dt / state.dayLength) % 1;
  if (!wasNight && isNight(state.time)) state.night++;
  if (wasNight && !isNight(state.time)) state.survived++;
}
export class DayView {
  private sunMesh: T.Mesh;
  private moon: T.Mesh;
  private stars: T.Points<T.BufferGeometry, T.PointsMaterial>;
  private day = new T.Color(0xc1dfe9);
  private night = new T.Color(0x3b526f);
  private sunset = new T.Color(0xedb48e);
  private moonlight = new T.Color(0xa6c5ed);
  private sunlight = new T.Color();
  constructor(private scene: T.Scene, private sun: T.DirectionalLight, private ambient: T.HemisphereLight) {
    const sphere = new T.SphereGeometry(1, 8, 6);
    this.sunMesh = new T.Mesh(sphere, new T.MeshBasicMaterial({ color: 0xffd995, fog: false }));
    this.moon = new T.Mesh(sphere, new T.MeshBasicMaterial({ color: 0xd7e5f3, fog: false }));
    const geometry = new T.BufferGeometry(), positions: number[] = [];
    for (let i = 0; i < 90; i++) {
      const angle = i * 2.39996, height = .2 + (i % 17) / 22;
      positions.push(Math.cos(angle) * 54 * Math.sqrt(1-height*height), height * 54, Math.sin(angle)*54*Math.sqrt(1-height*height));
    }
    geometry.setAttribute("position", new T.Float32BufferAttribute(positions,3));
    this.stars = new T.Points(geometry,new T.PointsMaterial({ color: 0xdce7ff, size: .13, transparent: true, fog: false }));
    scene.add(this.sunMesh, this.moon, this.stars);
  }
  update(time: number, origin: T.Vector3) {
    const angle = (time - .05) * Math.PI * 2;
    const height = Math.sin(angle);
    const daylight = T.MathUtils.smoothstep(height, -.38, .2);
    const sky = this.scene.background as T.Color;
    sky.copy(this.night).lerp(this.day, daylight);
    const dusk = Math.exp(-(((time-.62)/.07)**2));
    const dawn = Math.exp(-(((time-.03)/.055)**2));
    sky.lerp(this.sunset, Math.max(dusk*.55,dawn*.3));
    (this.scene.fog as T.Fog).color.copy(sky);
    this.sun.position.set(-Math.cos(angle)*30, height*40, 28);
    this.sun.intensity = .28 + daylight*1.65;
    // Smooth colour transitions keep dusk warm without sudden tint changes.
    this.sunlight.set(0xffc38c).lerp(new T.Color(0xffefd8),daylight);
    this.sun.color.copy(this.moonlight).lerp(this.sunlight,T.MathUtils.smoothstep(height,-.18,.12));
    this.ambient.intensity = .82 + daylight*.48;
    this.ambient.color.set(0x91afd4).lerp(new T.Color(0xe5f2fa),daylight);
    this.ambient.groundColor.set(0x37475b).lerp(new T.Color(0x6c7953),daylight);
    this.sunMesh.position.set(origin.x-Math.cos(angle)*49, Math.max(-9,height*49),origin.z+32);
    this.sunMesh.scale.setScalar(1.7);
    this.moon.position.set(origin.x-Math.cos(angle)*45, Math.max(-9,-height*45),origin.z+10);
    this.moon.scale.setScalar(1.2);
    this.stars.position.set(origin.x,0,origin.z);
    this.stars.material.opacity = 1-daylight;
    this.stars.visible = daylight < .8;
  }
}
