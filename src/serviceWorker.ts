// Zapnutí service workeru (soubor public/sw.js). Bez něj appka funguje pořád stejně,
// jen ji nejde nainstalovat na plochu a po ztrátě signálu se nenačte.
export const registerServiceWorker = () => {
  // Ve vývoji by cachoval soubory, které se mění při každém uložení – proto jen produkční build.
  if (!import.meta.env.PROD || !("serviceWorker" in navigator)) return;

  // Registrace se pouští až po načtení stránky, ať nesoupeří o linku s prvním vykreslením.
  window.addEventListener("load", () => {
    // BASE_URL je "./" (viz vite.config.ts), takže adresa vyjde vůči kořeni nasazené appky –
    // funguje to na doméně i v podadresáři na GitHub Pages.
    void navigator.serviceWorker
      .register(`${import.meta.env.BASE_URL}sw.js`, { scope: import.meta.env.BASE_URL })
      .catch(error => console.debug("Registrace service workeru selhala", error));
  });
};

export default registerServiceWorker;
