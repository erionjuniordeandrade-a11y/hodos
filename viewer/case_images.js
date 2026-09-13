// Original synthetic illustrations, not registered MRI or anatomical ground truth.
// Each case carries a FLAIR-style and a contrast-enhanced T1-style axial section at a matching level.
const flair=(id,where)=>({src:`./case-images/${id}.png`,sequence:'FLAIR',alt:`Synthetic axial FLAIR-style illustration with ${where}.`});
const t1c=(id,where)=>({src:`./case-images/${id}-t1c.png`,sequence:'T1 +C',alt:`Synthetic axial contrast-enhanced T1-style illustration at the same level, with ${where}.`});
export const CASE_IMAGES={
 'medial-frontal':[flair('medial-frontal','a left parasagittal frontal bright region, on the right of the image'),t1c('medial-frontal','a mildly dark, non-enhancing left medial frontal region and no ring of enhancement')],
 insular:[flair('insular','a left insular-region bright focus, on the right of the image. Perforator relationships are not established'),t1c('insular','a mildly dark, non-enhancing expansion of the left insula and no enhancement')],
 temporoparietal:[flair('temporoparietal','a left posterior temporal-parietal bright region, on the right of the image. No language or visual tract involvement is established'),t1c('temporoparietal','a mildly dark, non-enhancing left posterior temporal-parietal region and no enhancement')],
 'right-medial-frontal':[flair('right-medial-frontal','a right superior frontal bright region next to the midline with finger-like oedema, on the left of the image'),t1c('right-medial-frontal','an irregular ring of enhancement with a dark centre in the right medial frontal region, on the left of the image')],
};
export const IMAGE_CAPTION='AI-generated MRI-style illustrations · fictional case, preoperative. Anterior is at the top; patient left is image right. Illustrative anatomy, not a scan or registered volume. Use the written vignette for case facts; do not infer tract, vessel or margin relationships from these pixels.';
