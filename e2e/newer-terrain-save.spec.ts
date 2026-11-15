import {test,expect} from '@playwright/test';
test('neuere Terrainrevision zeigt Schutzmeldung und verändert keine Speicherdaten',async({page})=>{
 await page.goto('./');const raw=JSON.stringify({version:1,extension:{terrainRevision:3},sentinel:'do not overwrite'});
 await page.evaluate(raw=>{localStorage.clear();localStorage.setItem('blockboom.save',raw);},raw);await page.reload();
 await expect(page.locator('#start')).toContainText('Dieser Spielstand wurde mit einer neueren BLOCKBOOM-Version erstellt.');
 await page.waitForTimeout(600);expect(await page.evaluate(()=>Object.entries(localStorage))).toEqual([['blockboom.save',raw]]);
});
