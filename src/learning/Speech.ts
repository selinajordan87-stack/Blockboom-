/** Never select a network voice: all learning content must work without speech. */
export function speak(text: string) {
  if (!("speechSynthesis" in window) || !("SpeechSynthesisUtterance" in window))
    return "Vorlesen wird von diesem Browser nicht unterstützt.";
  const voice = speechSynthesis
    .getVoices()
    .find((v) => v.localService && v.lang.startsWith("de"));
  if (!voice)
    return "Keine lokale deutsche Stimme bereit. Du kannst alle Aufgaben auch lesen und die Hilfen nutzen.";
  try {
    speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.voice = voice;
    u.lang = "de-DE";
    u.rate = 0.85;
    u.onerror = () => {};
    speechSynthesis.speak(u);
    return "Wird vorgelesen.";
  } catch {
    return "Vorlesen ist gerade nicht verfügbar. Die Aufgabe bleibt lesbar.";
  }
}
