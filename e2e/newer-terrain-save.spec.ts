import {test,expect} from '@playwright/test';
for(const key of ['blockboom.save','blockboom.save.terrain2'])test(`neuere Terrainrevision zeigt Schutzmeldung und verändert keine Speicherdaten: ${key}`,async({page})=>{
 await page.goto('./');const raw=JSON.stringify({version:1,extension:{terrainRevision:3},sentinel:'do not overwrite'});
 await page.evaluate(({raw,key})=>{localStorage.clear();localStorage.setItem(key,raw);},{raw,key});await page.reload();
 await expect(page.locator('#start')).toContainText('Dieser Spielstand wurde mit einer neueren BLOCKBOOM-Version erstellt.');
 await page.waitForTimeout(600);expect(await page.evaluate(()=>Object.entries(localStorage))).toEqual([[key,raw]]);
});
