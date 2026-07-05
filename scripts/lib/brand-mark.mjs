export const brandBackgroundColor = "#13171d";
export const brandAccentColor = "#67d4c3";

/**
 * Shared brand mark SVG markup: a bold geometric "P" glyph on a dark rounded
 * square. Reused by the Chrome extension icon generator and the web app icon
 * generator so every surface renders the same mark.
 */
export function buildBrandMarkSvg(size) {
  return `<svg
      width="${size}"
      height="${size}"
      viewBox="0 0 128 128"
      xmlns="http://www.w3.org/2000/svg"
    >
      <rect width="128" height="128" rx="24" fill="${brandBackgroundColor}" />
      <path
        d="M40 30 H70 C86 30 98 42 98 58 C98 74 86 86 70 86 H56 V98 H40 Z
           M56 46 V70 H70 C77 70 82 65 82 58 C82 51 77 46 70 46 Z"
        fill="${brandAccentColor}"
      />
    </svg>`;
}
