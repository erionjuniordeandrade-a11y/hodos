/** Display glossary derived from the HCP1065 publisher workbook, fetched 2026-09-10.
 * https://github.com/data-others/atlas/releases/download/hcp1065/abbreviation.xlsx
 * SHA256 ead75629c22adfdec416ebf0de0b854ec3247679da33e50d0e6d9e30eafa71f6
 * CC BY-SA 4.0, Yeh 2022. Spaces/case adapted for reading; original IDs retained.
 * Source has wrong name-side suffixes in C_FP_R and TR_S_R. Side is always
 * derived from the installed bundle ID, never copied from that name column.
 */
export const GLOSSARY_SOURCE='https://brain.labsolver.org/hcp_trk_atlas.html';
export const BUNDLE_NAMES=Object.freeze({
  "AF": "Arcuate Fasciculus",
  "C_FPH": "Cingulum Frontal Parahippocampal",
  "C_FP": "Cingulum Frontal Parietal",
  "C_PHP": "Cingulum Parahippocampal Parietal",
  "C_PH": "Cingulum Parahippocampal",
  "C_PO": "Cingulum Parolfactory",
  "EMC": "Extreme Capsule",
  "FAT": "Frontal Aslant Tract",
  "IFOF": "Inferior Fronto Occipital Fasciculus",
  "ILF": "Inferior Longitudinal Fasciculus",
  "MdLF": "Middle Longitudinal Fasciculus",
  "PAT": "Parietal Aslant Tract",
  "SLF1": "Superior Longitudinal Fasciculus1",
  "SLF2": "Superior Longitudinal Fasciculus2",
  "SLF3": "Superior Longitudinal Fasciculus3",
  "UF": "Uncinate Fasciculus",
  "VOF": "Vertical Occipital Fasciculus",
  "AR": "Acoustic Radiation",
  "CBT": "Corticobulbar Tract",
  "CPT_F": "Corticopontine Tract Frontal",
  "CPT_P": "Corticopontine Tract Parietal",
  "CPT_O": "Corticopontine Tract Occipital",
  "CS_A": "Corticostriatal Tract Anterior",
  "CS_S": "Corticostriatal Tract Superior",
  "CS_P": "Corticostriatal Tract Posterior",
  "CST": "Cortico Spinal Tract",
  "DRTT": "Dentatorubrothalamic Tract",
  "F": "Fornix",
  "ML": "Medial Lemniscus",
  "OR": "Optic Radiation",
  "RST": "Reticulospinal Tract",
  "TR_A": "Thalamic Radiation Anterior",
  "TR_P": "Thalamic Radiation Posterior",
  "TR_S": "Thalamic Radiation Superior",
  "AC": "Anterior Commissure",
  "CC": "Corpus Callosum",
  "CB": "Cerebellum",
  "ICP": "Inferior Cerebellar Peduncle",
  "MCP": "Middle Cerebellar Peduncle",
  "SCP": "Superior Cerebellar Peduncle",
  "V": "Vermis",
  "CNII": "Cranial nerve II (optic)",
  "CNIII": "Cranial nerve III (oculomotor)",
  "CNV": "Cranial nerve V (trigeminal)",
  "CNVII": "Cranial nerve VII (facial)",
  "CNVIII": "Cranial nerve VIII (vestibulocochlear)"
});
export function bundleLabel(id){
  const sided=/_[LR]$/.test(id),family=sided?id.slice(0,-2):id;
  const name=BUNDLE_NAMES[family]||family;
  return `${name}${id.endsWith('_L')?' · left':id.endsWith('_R')?' · right':''}`;
}
