/** A bounded window of real frame intervals. These are browser observations, not device claims. */
export class FrameStats {
 private samples:number[]=[];
 record(seconds:number){if(Number.isFinite(seconds)&&seconds>0){this.samples.push(seconds*1000);if(this.samples.length>240)this.samples.shift();}}
 snapshot(){
  const sorted=this.samples.slice().sort((a,b)=>a-b),mean=this.samples.reduce((a,b)=>a+b,0)/(this.samples.length||1);
  return {fps:mean?1000/mean:0,frameMs:this.samples.at(-1)||0,p95Ms:sorted[Math.floor((sorted.length-1)*.95)]||0,samples:this.samples.length};
 }
}
