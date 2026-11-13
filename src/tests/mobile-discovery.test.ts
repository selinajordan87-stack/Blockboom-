import {afterEach,describe,expect,it,vi} from "vitest";
import {interactionLabel,mobileActions,QUICK_TOOLS,SlotHold,type MobileContext} from "../ui/MobileHUD";

const context=(overrides:Partial<MobileContext>={}):MobileContext=>({tool:"Bauwerkzeug",functional:false,nearby:false,spot:false,fishing:"idle",zombie:false,block:"Glas",blockColor:"#bde6ed",hasTarget:true,...overrides});
afterEach(()=>vi.useRealTimers());

describe("mobile Weltaktionen statt Materialname als Ziel",()=>{
 it("öffnet die tatsächlich anvisierte Truhe und lässt sie mit dem Bauwerkzeug entfernen",()=>{
  const s=context({functional:true,targetBlock:"Truhe"});expect(interactionLabel(s)).toBe("Öffnen");expect(mobileActions(s)).toEqual({interact:true,break:true,place:false,attack:false,fish:false});
 });
 it("erkennt Bett, Ofen, Tür und Tier statt des ausgewählten Glasblocks",()=>{
  expect(interactionLabel(context({targetBlock:"Bett"}))).toBe("Schlafen");expect(interactionLabel(context({functional:true,targetBlock:"Ofen"}))).toBe("Benutzen");expect(interactionLabel(context({targetBlock:"Tür offen"}))).toBe("Schließen");
  const s=context({animal:true,functional:true});expect(interactionLabel(s)).toBe("Tier");expect(mobileActions(s).break).toBe(false);
 });
 it("unterscheidet Bodenbearbeitung, Pflanzung, Wachstum und echte Ernte",()=>{
  expect(interactionLabel(context({tool:"Hacke",targetBlock:"Gras"}))).toBe("Umgraben");
  for(const cropAction of ["Pflanzen","Wächst","Ernten"] as const){const s=context({tool:"Hacke",cropAction,targetBlock:"Acker",functional:true});expect(mobileActions(s)).toMatchObject({interact:true,break:false,place:false});expect(interactionLabel(s)).toBe(cropAction==="Wächst"?"Prüfen":cropAction);}
 });
 it("bietet einen Welttext zum Lesen an, ohne ihn gleichzeitig zum Abbau anzubieten",()=>{
  const s=context({noteAction:"Schmiedebuch",targetLabel:"Kupfer und Eisen"});expect(interactionLabel(s)).toBe("Lesen");expect(mobileActions(s)).toMatchObject({interact:true,place:false,break:false,attack:false});
 });
 it("behält Bauen in der Nähe von Missions- und Angelpunkten frei",()=>{
  expect(mobileActions(context({nearby:true}))).toMatchObject({place:true,interact:true,break:false});expect(mobileActions(context({nearby:true,tool:"Axt"}))).toMatchObject({break:true,interact:false});
 });
 it("zeigt ohne erreichbaren Block keine wirkungslose Bau- oder Abbauaktion",()=>{
  expect(mobileActions(context({hasTarget:false}))).toMatchObject({place:false,break:false});expect(mobileActions(context({hasTarget:false,tool:"Axt"})).break).toBe(false);
 });
 it("priorisiert den tatsächlichen Nahkampf und erhält die aktive Angelaktion",()=>{
  expect(mobileActions(context({tool:"Axt",zombie:true,functional:true}))).toEqual({attack:true,place:false,break:false,interact:false,fish:false});
  expect(mobileActions(context({tool:"Angel",spot:true,fishing:"drill"}))).toEqual({fish:true,place:false,break:false,interact:false,attack:false});
  expect(mobileActions(context({tool:"Angel",spot:true}))).toMatchObject({fish:true,interact:true});
 });
 it("beschränkt die Kontextaktionen in allen Kombinationen auf zwei",()=>{
  for(const tool of ["Bauwerkzeug","Axt","Angel","Schwert","Hacke"] as const)for(const functional of [false,true])for(const nearby of [false,true])for(const spot of [false,true])for(const fishing of ["idle","charging","drill"])for(const zombie of [false,true]){
   expect(Object.values(mobileActions(context({tool,functional,nearby,spot,fishing,zombie}))).filter(Boolean).length).toBeLessThanOrEqual(2);
  }
 });
 it("enthält vier direkte Grundwerkzeuge statt zusätzlicher verschachtelter Toolmenüs",()=>{
  expect(QUICK_TOOLS.map(s=>s.tool)).toEqual(["Spitzhacke","Axt","Schwert","Angel"]);expect(new Set(QUICK_TOOLS.map(s=>s.id)).size).toBe(4);
 });
});

describe("Inventar durch bewusstes Halten",()=>{
 it("öffnet nach 450 ms genau einmal und unterdrückt den kurzen Werkzeugtap",()=>{
  vi.useFakeTimers();const open=vi.fn(),h=new SlotHold(open);h.start(1,20,20);vi.advanceTimersByTime(449);expect(open).not.toHaveBeenCalled();vi.advanceTimersByTime(1);expect(open).toHaveBeenCalledTimes(1);h.end(1);expect(h.tapAllowed).toBe(false);vi.advanceTimersByTime(1000);expect(open).toHaveBeenCalledTimes(1);
 });
 it("lässt einen fremden Finger den Haltekontakt nicht abbrechen",()=>{
  vi.useFakeTimers();const open=vi.fn(),h=new SlotHold(open);h.start(1,20,20);h.start(2,50,50);h.end(2);h.cancelPointer(2);vi.advanceTimersByTime(450);expect(open).toHaveBeenCalledTimes(1);
 });
 it("öffnet bei Wegziehen, Loslassen oder Unterbrechung kein Inventar",()=>{
  vi.useFakeTimers();const open=vi.fn(),h=new SlotHold(open);h.start(1,20,20);h.move(1,40,20);vi.advanceTimersByTime(500);expect(open).not.toHaveBeenCalled();expect(h.tapAllowed).toBe(false);h.end(1);h.start(2,20,20);h.end(2);vi.advanceTimersByTime(500);expect(open).not.toHaveBeenCalled();expect(h.tapAllowed).toBe(true);h.start(3,20,20);h.cancel();vi.advanceTimersByTime(500);expect(open).not.toHaveBeenCalled();
 });
 it("erlaubt nach abgebrochenem Kontakt den nächsten Tap und Tastaturaktivierung",()=>{
  vi.useFakeTimers();const h=new SlotHold(vi.fn());h.start(1,0,0);h.cancel();h.start(2,0,0);h.end(2);expect(h.tapAllowed).toBe(true);h.start(3,0,0);vi.advanceTimersByTime(450);expect(h.tapAllowed).toBe(false);h.keyboard();expect(h.tapAllowed).toBe(true);
 });
});
