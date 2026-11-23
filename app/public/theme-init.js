// public/theme-init.js — load as the FIRST <script> in <head>, blocking (no defer/async):
//   <script src="./theme-init.js"></script>
// Sets data-theme before CSS paints, so there is no flash of the wrong theme. External file
// because the meta CSP forbids inline scripts. Keys use the app.id prefix "quizzard:v1:".
// The storage module saves values as JSON ("dark" with quotes), so parse before comparing.
(function () {
  try {
    var raw = localStorage.getItem("quizzard:v1:theme");
    var t = raw === null ? null : JSON.parse(raw);
    if (t === "light" || t === "dark") document.documentElement.setAttribute("data-theme", t);
  } catch (e) {
    /* storage blocked or unreadable: follow the system theme */
  }
  // Launch splash (logo + tagline, ~1.3 s) once per browser session — not in an iframe, not for
  // deep links (#help…). CSS shows .splash only under [data-splash]; main.ts
  // removes it. Without JS/CSS support it simply never appears.
  try {
    // navigator.webdriver: automated tests skip it (one e2e test turns it back on).
    if (window.self === window.top && !navigator.webdriver && !location.hash && !sessionStorage.getItem("quizzard:v1:splash")) {
      document.documentElement.setAttribute("data-splash", "");
      sessionStorage.setItem("quizzard:v1:splash", "1");
    }
  } catch (e) {
    /* storage blocked: no splash */
  }
  // A deep link into a tool (#/teams…): mark it before the first paint, so Home's header layout (no bar on phones)
  // and the tool's colour are right from the start; router/screen.ts keeps data-tool up to date afterwards.
  var tool = /^#\/([a-z0-9-]+)/.exec(location.hash);
  if (tool) document.documentElement.setAttribute("data-tool", tool[1]);
})();
