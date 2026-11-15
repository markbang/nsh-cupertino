// The page's host: the two things the site needs from the browser and NSH has
// no API for - the Dynamic Type control, which the web runtime reads from the
// root element's font size, and the document title of the shared route.
export function createHost() {
  return {
    call(name, args) {
      if (name === "site.fontScale") {
        const scale = Math.min(1.5, Math.max(0.85, Number(args?.scale) || 1));
        document.documentElement.style.fontSize = `${16 * scale}px`;
        // The runtime re-reads the environment on a resize; text is laid out
        // again at the new scale.
        dispatchEvent(new Event("resize"));
        return null;
      }
      if (name === "site.title") {
        document.title = String(args?.title ?? "Cupertino");
        return null;
      }
      if (name === "site.locale") {
        const language = String(args?.language ?? "en");
        document.documentElement.lang = language === "zh" ? "zh-Hans" : "en";
        return null;
      }
      throw new Error(`no host function ${name}`);
    },
  };
}
