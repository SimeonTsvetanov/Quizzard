// Literal-colour detection for scripts/check-miniapp-tokens.ts: mini-app CSS takes every colour from
// Quizzard's tokens (design → css-architecture §5), so a hex, a colour function or a named colour in a
// declaration is a finding. System colours (CanvasText …) and keywords stay allowed: forced-colours
// rules need them and they follow the person's settings.

/** CSS Color 4 named colours, `transparent` left out (it is no colour choice). */
const NAMED_COLORS = new Set(
  (
    "aliceblue antiquewhite aqua aquamarine azure beige bisque black blanchedalmond blue blueviolet brown burlywood " +
    "cadetblue chartreuse chocolate coral cornflowerblue cornsilk crimson cyan darkblue darkcyan darkgoldenrod darkgray " +
    "darkgreen darkgrey darkkhaki darkmagenta darkolivegreen darkorange darkorchid darkred darksalmon darkseagreen " +
    "darkslateblue darkslategray darkslategrey darkturquoise darkviolet deeppink deepskyblue dimgray dimgrey dodgerblue " +
    "firebrick floralwhite forestgreen fuchsia gainsboro ghostwhite gold goldenrod gray green greenyellow grey honeydew " +
    "hotpink indianred indigo ivory khaki lavender lavenderblush lawngreen lemonchiffon lightblue lightcoral lightcyan " +
    "lightgoldenrodyellow lightgray lightgreen lightgrey lightpink lightsalmon lightseagreen lightskyblue lightslategray " +
    "lightslategrey lightsteelblue lightyellow lime limegreen linen magenta maroon mediumaquamarine mediumblue " +
    "mediumorchid mediumpurple mediumseagreen mediumslateblue mediumspringgreen mediumturquoise mediumvioletred " +
    "midnightblue mintcream mistyrose moccasin navajowhite navy oldlace olive olivedrab orange orangered orchid " +
    "palegoldenrod palegreen paleturquoise palevioletred papayawhip peachpuff peru pink plum powderblue purple " +
    "rebeccapurple red rosybrown royalblue saddlebrown salmon sandybrown seagreen seashell sienna silver skyblue " +
    "slateblue slategray slategrey snow springgreen steelblue tan teal thistle tomato turquoise violet wheat white " +
    "whitesmoke yellow yellowgreen"
  ).split(" "),
);

const HEX_COLOR = /#(?:[0-9a-f]{8}|[0-9a-f]{6}|[0-9a-f]{3,4})\b/i;
const COLOR_FUNCTION = /\b(?:rgba?|hsla?|hwb|lab|lch|oklab|oklch|color)\(/i;
/** Properties whose plain words can be colours; elsewhere `tan` or `red` may be a name (grid area …). */
const COLOR_PROPERTY = /^--|(?:^|-)(?:color|background|border|outline|shadow|fill|stroke|decoration|caret|column-rule|scrollbar)/i;
/** Strings and `url(…)` may contain `#` or colour words that are not colours. */
const STRINGS_AND_URLS = /"(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*'|url\([^)]*\)/gi;

/**
 * Finds the first literal colour in a declaration value.
 * @param property - the declaration's property (named colours count only in colour properties)
 * @param value - its value
 * @returns the literal as written (`#fff`, `rgb(`, `red`), or `null` when the value has none
 */
export function findLiteralColor(property: string, value: string): string | null {
  const text = value.replace(STRINGS_AND_URLS, " ");
  const literal = HEX_COLOR.exec(text)?.[0] ?? COLOR_FUNCTION.exec(text)?.[0];
  if (literal !== undefined) return literal;
  if (!COLOR_PROPERTY.test(property)) return null;
  return text.split(/[^A-Za-z-]+/).find((word) => NAMED_COLORS.has(word.toLowerCase())) ?? null;
}
