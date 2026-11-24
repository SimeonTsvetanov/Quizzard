// Side-effect stylesheet imports (Vite bundles them; `tsc` only needs to know they exist).
declare module "*.css";
// An SVG as its text (Vite `?raw`): the brand's logo, drawn from Quizzard's own file.
declare module "*.svg?raw" {
  const text: string;
  export default text;
}
