import {it,expect} from 'vitest';
import {World} from '../world/World';
import {terrainProfile,generateDiscoveryColumn} from '../world/DiscoveryTerrain';
import {defaultExpansion,readExpansion} from '../inventory/Equipment';
it('aktiviert neue Geometrie niemals stillschweigend für alte oder unbekannte Spielstände',()=>{
 const legacy=defaultExpansion(4);delete legacy.terrainRevision;
 expect(readExpansion(legacy).terrainRevision).toBe(1);
 expect(readExpansion({...legacy,terrainRevision:99}).terrainRevision).toBe(1);
 expect(readExpansion({...legacy,terrainRevision:2}).terrainRevision).toBe(2);
 expect(new World().terrainRevision).toBe(1);
});
it('formt neue Berg- und Seespalten nur in Revision 2 und erhält Siedlung sowie Minenzugang',()=>{
 let changed=0;
 for(let x=115;x<=170;x+=5)for(let z=-135;z<=-95;z+=5)if(terrainProfile(x,z,1).top!==terrainProfile(x,z,2).top)changed++;
 expect(changed).toBeGreaterThan(30);
 for(const [x,z]of [[100,85]]){const before=terrainProfile(x,z,1),after=terrainProfile(x,z,2);expect(after.top).toBe(before.top);expect(after.surface).toBe(before.surface);expect(after.bridge).toBe(before.bridge);expect(after.jetty).toBe(before.jetty);}
 expect(terrainProfile(-134,-110,2).top).toBeLessThan(terrainProfile(-134,-110,1).top);
 const old=new World(),fresh=new World();fresh.terrainRevision=2;generateDiscoveryColumn(old,123,-121);generateDiscoveryColumn(fresh,123,-121);
 expect([...fresh.blocks].filter(([k])=>k.startsWith('123,')&&k.endsWith(',-121'))).not.toEqual([...old.blocks].filter(([k])=>k.startsWith('123,')&&k.endsWith(',-121')));
});
