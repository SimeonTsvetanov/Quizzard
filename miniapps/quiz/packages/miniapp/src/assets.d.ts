// Side-effect stylesheet imports (Vite bundles them; `tsc` only needs to know they exist).
declare module "*.css";

// A file's text (Vite `?raw`): the player template, built into packages/player/dist before the app.
declare module "*?raw" {
  const text: string;
  export default text;
}
