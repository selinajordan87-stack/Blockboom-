import type {Cell} from "../world/World";
export type BookCategory="Fische"|"Tiere"|"Pflanzen"|"Rohstoffe"|"Orte"|"Zombies"|"Bauwissen"|"Abenteuerhinweise";
export interface WorldNote {
  id:string;title:string;text:string[];position:Cell;category:BookCategory;
  difficulty:"A"|"B"|"C"|"D";hints:string[];
  task?:{kind:"write"|"number"|"order";prompt:string;solution:string;variants?:string[]};
}
/** Text is useful in the actual game; knowledge and typing demand are independent. */
export const NOTES:WorldNote[]=[
 {id:"start-plan",title:"Ein Platz für die Nacht",position:[2,1,14],category:"Bauwissen",difficulty:"A",
  text:["Sammle Holz am Baum und Stein am Felsen; wähle danach einen Block und setze ihn am durchsichtigen Umriss.","Eigene Wände, Tür, Dach und Licht bilden deinen Unterschlupf – ergänze Werkbank, Bett und Truhe."],
  hints:["Unten wählst du Werkzeug und Baumaterial. Die Aktion am rechten Rand passt zum Ziel.","Türen brauchen zwei freie Blöcke übereinander. Zum Abbauen wählst du die Spitzhacke oder Axt."]},
 {id:"wall-plan",title:"Die Vorratsrechnung",position:[3,1,14],category:"Bauwissen",difficulty:"B",
  text:["Bevor du eine Wand baust, kannst du ihren Materialbedarf abschätzen. Eine geschlossene Wand mit acht Blöcken Breite und vier Blöcken Höhe besteht aus vier gleich langen Reihen.","Für ein Fenster oder eine Tür ziehst du die freien Felder anschließend ab. Dein Haus darf selbstverständlich auch eine andere Form haben."],
  hints:["Rechne die Zahl der Reihen mal die Länge einer Reihe.","8 · 4 = 32. Das ist der Bedarf ohne Öffnungen."],task:{kind:"number",prompt:"Wie viele Blöcke braucht diese Wand ohne Öffnungen?",solution:"32",variants:["32 Blöcke"]}},
 {id:"garden-page",title:"Das Gartenblatt",position:[8,1,15],category:"Pflanzen",difficulty:"B",
  text:["Eine Hacke stellst du aus zwei Holzblöcken und einem Stein her. Rüste sie aus und bearbeite damit Gras oder Erde.","Wähle im Gartenmenü Samen und benutze den Acker erneut. Weizen, Karotten, Kartoffeln und Kürbisse zeigen beim Wachsen mehrere Stufen.","Die reife Pflanze gibt Ernte und neue Samen. Das Wachstum zählt nur, während du spielst; du kannst währenddessen bauen oder auf Entdeckung gehen."],
  hints:["Werkzeuge und Rezepte findest du im Inventar beziehungsweise bei Crafting. Im Garten wählst du die Samen.","Weizen wächst in zwei Minuten aktiver Spielzeit. Das Öffnen eines Menüs beschleunigt ihn nicht."]},
 {id:"river-trace",title:"Die Spur hinter dem Fluss",position:[24,1,-8],category:"Abenteuerhinweise",difficulty:"B",
  text:["Auf der Notiz sind Regentropfen getrocknet. Darunter steht: Hinter dem Fluss haben wir die Schmiede verlassen. Der alte Turm war noch von weitem zu sehen.","Der Rauch verrät den Weg besser als eine Zahl auf einer Karte. Suche zwischen den Gebäuden nach dem Arbeitsplatz des Schmieds."],
  hints:["Schau nach dem Turm und der Rauchsäule. Du musst keinem unsichtbaren Punkt folgen.","Die alte Siedlung liegt südöstlich vom Start. Die Schmiede steht zwischen den anderen Häusern."]},
 {id:"outpost-letter",title:"Ein Brief aus den alten Höfen",position:[42,1,28],category:"Abenteuerhinweise",difficulty:"B",
  text:["Diese Häuser waren nur unser Außenposten. Die große Schmiede liegt weiter im Südosten, jenseits des Flusses.","Folge dem Erdweg nach Osten und dann zwischen den Bäumen nach Süden. Beim hohen Wachturm steigt noch Rauch auf; im Schmiedehaus liegt unser Tagebuch."],
  hints:["Der kleine Hof ist nicht das Ende der Welt. Der Weg führt über die alte Landschaft hinaus.","Suche die größere Häusergruppe mit dem hohen Turm. Ihr Tagebuch erklärt den nächsten Werkzeugschritt."]},
 {id:"forge-diary",title:"Das Tagebuch des Schmieds",position:[103,1,88],category:"Rohstoffe",difficulty:"C",
  text:["Kupfer lässt sich leicht bearbeiten. Für die nächste Werkzeugstufe reicht aber kein loses Erzstück: Im Ofen wird es mit Kohle zu Metall verarbeitet.","Mit drei Kupferbarren und zwei Holzblöcken entsteht eine Kupferspitzhacke. Damit lässt sich Eisenerz abbauen. Drei Eisenbarren und Holz ergeben anschließend die Eisenspitzhacke für Gold.","Der Schmied hat am Rand ergänzt: Der Berg bewahrt unsere Vorräte. Wer zurückkehrt, soll zuerst den sicheren Abstieg suchen."],
  hints:["Kohleerz liefert beim Abbauen zusätzlich Brennstoff. Benutze einen Ofen für die Metallrezepte.","Spitzhacke → Kupfer → Kupferspitzhacke → Eisen. Diese Reihenfolge funktioniert im Spiel."],
  task:{kind:"order",prompt:"Welches Metall brauchst du für das Werkzeug, das Eisenerz abbauen kann?",solution:"Kupfer",variants:["Kupferbarren"]}},
 {id:"mine-map",title:"Die Karte des Bergmanns",position:[130,1,-90],category:"Abenteuerhinweise",difficulty:"B",
  text:["Der dunkle Spalt führt über einen abfallenden Gang in den Berg. Folge zunächst dem breiten Weg und merke dir jede Abzweigung.","Weiter unten liegen andere Erze. Nimm Fackeln mit und lass auf deinem Rückweg Lichtpunkte zurück. Eine Spitzhacke und ein sicherer Ausgang sind wichtiger als ein voller Rucksack."],
  hints:["Gehe wirklich in den Gang hinein. Eine Höhle auf der Karte anzusehen ist noch kein Höhlenbesuch.","Wenn es dunkel wird, kannst du die Kamera zurücksetzen und umdrehen. Baue dir den Rückweg nicht zu."]},
 {id:"crystal-code",title:"Zeichen an der alten Kammer",position:[157,-12,-90],category:"Abenteuerhinweise",difficulty:"D",
  text:["Zwischen den Zeichen ist die Skizze einer eckigen, durchscheinenden Spitze zu erkennen. Darunter steht: Kein Metall, kein Holz. Unser Fund wuchs im Stein und trägt seinen Namen mit zwei l.","Im Schmiedebuch wurde die geschützte Kammer erwähnt. Kombiniere die Spur vom Fluss, den Hinweis des Schmieds und dieses Zeichen. Die alte Fundtruhe liegt am Rand der Kammer, nicht oben auf dem Berg."],
  hints:["Das Wort beginnt mit K und hat acht Buchstaben.","Gesucht ist Kristall. Eine Hilfe oder das Überspringen sperrt die Erkundung nicht."],
  task:{kind:"write",prompt:"Welches Fundstück beschreibt der Hinweis?",solution:"Kristall",variants:["Bergkristall","ein Kristall","Ein Kristall"]}},
 {id:"angler-notes",title:"Zwischen den Wasserpflanzen",position:[-11,2,2],category:"Fische",difficulty:"B",
  text:["Der Hecht wartet häufig regungslos zwischen Wasserpflanzen. Sein langer Körper und das breite Maul passen zu einem Räuber, der aus kurzer Entfernung angreift.","Ein Kunstköder kann Räuber interessieren. Schau auf den Angelplatz, die sichtbaren Fische und deine Ausrüstung, bevor du wirfst. Ein passender Köder garantiert trotzdem keinen Fang."],
  hints:["Untersuche gefangene Fische, um Merkmale und Nahrung im Fangbuch zu vergleichen.","Kleine Friedfische fressen andere Nahrung als große Räuber. Probiere verschiedene Köder am selben Platz."]},
 {id:"forest-tracks",title:"Spuren im weichen Boden",position:[-35,1,12],category:"Tiere",difficulty:"B",
  text:["Ein Wolf oder eine Katze gewinnt mit passendem Fischfutter Vertrauen. Nutztiere nehmen Ernte oder Beeren an.","Nach zwei Fütterungen kannst du dem Tier einen Namen geben und zwischen Folgen, Warten und Schlafen wählen."],
  hints:["Nähere dich einem Tier und benutze die Kontextaktion. Streicheln ersetzt die Fütterung nicht.","Dein Tier bleibt beim Speichern erhalten. In der Begleiterliste findest du gezähmte Tiere wieder."]},
 {id:"cave-safety",title:"Notiz für die Rückkehr",position:[28,1,-30],category:"Zombies",difficulty:"C",
  text:["Geschlossene Türen und massive Wände halten Zombies auf. Eine Fackel hilft dir dagegen vor allem beim Sehen; sie ist kein unsichtbarer Schutzschild.","Ein sicherer Schlafplatz braucht ein Dach, umschlossene Seiten und Abstand zu nahen Zombies. In einer unklaren Situation darfst du immer pausieren oder den friedlichen Modus wählen."],
  hints:["Baue und schließe die Tür, bevor du dich auf den Schutz deines Hauses verlässt.","Dauerhafter Gebäudeschaden ist normalerweise ausgeschaltet. Diese Einstellung ist im Survivalmenü erreichbar."]},
 {id:"farm-area",title:"Platz für die nächste Ernte",position:[9,1,15],category:"Pflanzen",difficulty:"C",
  text:["Ein rechteckiges Beet mit vier Reihen und jeweils drei Feldern hat zwölf Pflanzplätze. Wenn du davon ein Viertel für Kürbisse reservierst, bleiben die anderen Plätze für deine übrigen Samen frei.","Rechne vor dem Pflanzen nach: Samen sind Vorräte. Bei einer reifen Ernte bekommst du wieder welche zurück."],
  hints:["Ein Viertel von zwölf ist zwölf geteilt durch vier.","Drei Felder für Kürbisse. Für die Aufgabe genügt die Zahl 3."],task:{kind:"number",prompt:"Wie viele der zwölf Felder sind ein Viertel?",solution:"3",variants:["3 Felder"]}},
 {id:"forge-correction",title:"Ein Satz im Schmiedebuch",position:[104,1,88],category:"Bauwissen",difficulty:"C",
  text:["Im feuchten Buch sind einige Buchstaben verblasst. Lesbar ist noch: Die wiederstandsfähige Tür schützt die Vorräte.","Ein sorgfältig gebauter Durchgang ist nützlich. Das Wort für die Eigenschaft der Tür braucht jedoch kein ie nach dem w."],
  hints:["Widerstand schreibt man ohne ie.","Das gesuchte Wort lautet widerstandsfähige. Du musst nicht den ganzen Satz abschreiben."],task:{kind:"write",prompt:"Verbessere nur das falsch geschriebene Wort.",solution:"widerstandsfähige",variants:["widerstandsfähig"]}},
 {id:"near-mine",title:"Ein dunkler Spalt",position:[27,1,-30],category:"Orte",difficulty:"A",
  text:["Hier führt ein Gang unter den Felsen.","Erkunde mit Licht und merke dir den Weg zurück; der alte Berg mit der großen Kammer liegt weiter im Nordosten."],
  hints:["Der nahe Gang ist ein erster Höhleneinstieg. Für die große Berggeschichte suche später die Spur des Schmieds.","Halte den Rückweg frei und nimm eine Spitzhacke mit."]},
];
export interface BookEntry {id:string;title:string;category:BookCategory;text:string[];noteId?:string;}
export const CHAPTERS=[
 {id:"shelter",title:"Ein Platz für die Nacht",hint:"Sammle Holz und Stein. Baue eigene Wände, Dach und Tür; ergänze Licht, Bett, Werkbank und Truhe. Schlafe sicher."},
 {id:"trail",title:"Die Spur",hint:"Lies die Notiz am Fluss und suche die Silhouette des alten Turms."},
 {id:"settlement",title:"Verlassene Siedlung",hint:"Betritt die Siedlung und lies das Tagebuch in der Schmiede."},
 {id:"mine",title:"Der alte Berg",hint:"Lies die Bergmannskarte und betrete den unterirdischen Gang."},
 {id:"iron",title:"Unter der Erde",hint:"Baue Eisenerz ab und verarbeite es im Ofen zu Eisen."},
 {id:"chamber",title:"Die verschlossene Kammer",hint:"Lies und verbinde die Spuren an der Kammer. Bei Bedarf hilft dir ein Hinweis."},
 {id:"find",title:"Das Fundstück",hint:"Öffne die alte Fundtruhe im Berg. Dein Fund bleibt in deiner Welt gespeichert."},
] as const;
