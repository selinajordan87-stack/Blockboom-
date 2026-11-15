/** A separate build and storage area; production worlds are never read by it. */
export const VISUAL_PREVIEW = (import.meta as ImportMeta & {env:{VITE_VISUAL_PREVIEW?:string}}).env.VITE_VISUAL_PREVIEW === '1';
export const storageKey=(name:string)=>VISUAL_PREVIEW?`blockboom.preview-v072.${name.replace(/^blockboom\./,'')}`:name;
