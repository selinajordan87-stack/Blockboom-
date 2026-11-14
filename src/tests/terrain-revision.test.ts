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
it('formt echte Bergspalten nur im opt-in-Prototyp und lässt See und Siedlung identisch',()=>{
 let changed=0;
 for(let x=115;x<=170;x+=5)for(let z=-135;z<=-95;z+=5)if(terrainProfile(x,z,1).top!==terrainProfile(x,z,2).top)changed++;
 expect(changed).toBeGreaterThan(30);
 for(const [x,z]of [[-115,-85],[-134,-110],[100,85],[130,-90]])expect(terrainProfile(x,z,2)).toEqual(terrainProfile(x,z,1));
 const old=new World(),fresh=new World();fresh.terrainRevision=2;generateDiscoveryColumn(old,155,-125);generateDiscoveryColumn(fresh,155,-125);
 expect([...fresh.blocks].filter(([k])=>k.startsWith('155,')&&k.endsWith(',-125'))).not.toEqual([...old.blocks].filter(([k])=>k.startsWith('155,')&&k.endsWith(',-125')));
});
