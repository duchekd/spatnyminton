// Klíče v localStorage nesly dřív název „randomizer". Po přejmenování appky na ŠpatnýMinton
// by se data pod novým klíčem nenašla a uživateli by zmizely sady i nastavení – tak je
// při prvním spuštění přendáme. Volá se před vytvořením store (zustand persist si čte
// hodnotu hned při inicializaci).
export const adoptLegacyKey = (legacyKey: string, key: string) => {
  if (typeof localStorage === "undefined") return;

  const legacy = localStorage.getItem(legacyKey);
  // nová data mají přednost – starý klíč jen uklidíme
  if (legacy !== null && localStorage.getItem(key) === null) localStorage.setItem(key, legacy);
  if (legacy !== null) localStorage.removeItem(legacyKey);
};
