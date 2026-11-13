import type {Page} from "@playwright/test";
export async function menuPage(page:Page,id:string){
 if(!await page.locator(`#${id}`).isVisible())await page.locator("#menu").click();
 await page.locator(`#${id}`).click();
}
/** Follow the public menu route when a former permanent shortcut is now hidden. */
export async function shortcut(page:Page,id:string){
 if(await page.locator(`#${id}`).isVisible()){await page.locator(`#${id}`).click();return;}
 if(id==="zoom"){await menuPage(page,"menu-camera");await page.locator("#zoom").click();return;}
 const routes:Record<string,string>={bag:"menu-inventory","living-menu":"menu-adventure",learn:"menu-learning",journal:"menu-missions",tackle:"menu-tackle","reset-boom":"menu-boom","word-battle":"menu-battle",undo:"menu-undo","tool-toggle":"menu-tools",map:"menu-map",garden:"menu-garden",workbench:"menu-workbench",log:"menu-log",book:"menu-book"};
 if(!routes[id])throw Error(`Unbekannter Menüweg: ${id}`);await menuPage(page,routes[id]);
}
/** Legacy spelling remains deliberately available beside contextual challenges. */
export async function shortWordExercise(page:Page){
 await shortcut(page,"learn");const button=page.locator("#short-word-exercise");if(await button.isVisible())await button.click();
}
