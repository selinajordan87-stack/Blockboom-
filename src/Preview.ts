/** A separate build and storage area; production worlds are never read by it. */
export const VISUAL_PREVIEW = (import.meta as ImportMeta & {env:{VITE_VISUAL_PREVIEW?:string}}).env.VITE_VISUAL_PREVIEW === '1';
// The visual preview had a camera/terrain defect. Its experimental state is
// deliberately isolated once more so an old stuck player position cannot keep
// reopening in the repaired build. Production storage is never touched.
export const storageKey=(name:string)=>VISUAL_PREVIEW?`blockboom.preview-v072r2.${name.replace(/^blockboom\./,'')}`:name;
