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
  private day = new T.Color(0x9ed2df);
  private night = new T.Color(0x14243c);
  private sunset = new T.Color(0xb77c79);
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
    if (time > .53 && time < .73) sky.lerp(this.sunset, Math.sin((time-.53)/.2*Math.PI)*.55);
    (this.scene.fog as T.Fog).color.copy(sky);
    this.sun.position.set(Math.cos(angle)*30, height*40, -12);
    this.sun.intensity = .15 + daylight*2;
    this.sun.color.set(daylight < .6 ? 0xffb980 : 0xffedc2);
    this.ambient.intensity = .66 + daylight*1.59;
    this.ambient.color.set(daylight < .3 ? 0x91b0dd : 0xeaf8ff);
    this.sunMesh.position.set(origin.x+Math.cos(angle)*49, Math.max(-9,height*49),origin.z-14);
    this.sunMesh.scale.setScalar(1.7);
    this.moon.position.set(origin.x-Math.cos(angle)*45, Math.max(-9,-height*45),origin.z+10);
    this.moon.scale.setScalar(1.2);
    this.stars.position.set(origin.x,0,origin.z);
    this.stars.material.opacity = 1-daylight;
    this.stars.visible = daylight < .8;
  }
}
