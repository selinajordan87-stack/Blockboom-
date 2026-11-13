import type {Page} from "@playwright/test";
export async function menuPage(page:Page,id:string){
 if(!await page.locator(`#${id}`).isVisible())await page.locator("#menu").click();
 await page.locator(`#${id}`).click();
}
/** Follow the public menu route when a former permanent shortcut is now hidden. */
export async function shortcut(page:Page,id:string){
 if(await page.locator(`#${id}`).isVisible()){await page.locator(`#${id}`).click();return;}
 const routes:Record<string,string>={bag:"menu-inventory","living-menu":"menu-adventure",learn:"menu-learning",journal:"menu-missions",tackle:"menu-tackle","reset-boom":"menu-boom","word-battle":"menu-battle",undo:"menu-undo"};
 if(!routes[id])throw Error(`Unbekannter Menüweg: ${id}`);await menuPage(page,routes[id]);
}
