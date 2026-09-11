/** Glossary derived from the HCP1065 publisher workbook, fetched 2026-09-10.
 * https://github.com/data-others/atlas/releases/download/hcp1065/abbreviation.xlsx
 * SHA256 ead75629c22adfdec416ebf0de0b854ec3247679da33e50d0e6d9e30eafa71f6
 * CC BY-SA 4.0, Yeh 2022. Spaces/case adapted for reading; original IDs retained.
 * Source has wrong name-side suffixes in C_FP_R and TR_S_R. Side is always
 * derived from the installed bundle ID, never copied from that name column.
 */
export const GLOSSARY_SOURCE='https://brain.labsolver.org/hcp_trk_atlas.html';
/** Reading names for the interface. Source workbook names stay in SOURCE_NAMES so
 * a search for the publisher's wording (e.g. "Cortico Spinal") still finds the bundle. */
export const BUNDLE_NAMES=Object.freeze({
  "AF": "Arcuate fasciculus",
  "C_FPH": "Cingulum, frontal-parahippocampal",
  "C_FP": "Cingulum, frontal-parietal",
  "C_PHP": "Cingulum, parahippocampal-parietal",
  "C_PH": "Cingulum, parahippocampal",
  "C_PO": "Cingulum, parolfactory",
  "EMC": "Extreme capsule",
  "FAT": "Frontal aslant tract",
  "IFOF": "Inferior fronto-occipital fasciculus",
  "ILF": "Inferior longitudinal fasciculus",
  "MdLF": "Middle longitudinal fasciculus",
  "PAT": "Parietal aslant tract",
  "SLF1": "Superior longitudinal fasciculus I",
  "SLF2": "Superior longitudinal fasciculus II",
  "SLF3": "Superior longitudinal fasciculus III",
  "UF": "Uncinate fasciculus",
  "VOF": "Vertical occipital fasciculus",
  "AR": "Acoustic radiation",
  "CBT": "Corticobulbar tract",
  "CPT_F": "Corticopontine tract, frontal",
  "CPT_P": "Corticopontine tract, parietal",
  "CPT_O": "Corticopontine tract, occipital",
  "CS_A": "Corticostriatal tract, anterior",
  "CS_S": "Corticostriatal tract, superior",
  "CS_P": "Corticostriatal tract, posterior",
  "CST": "Corticospinal tract",
  "DRTT": "Dentatorubrothalamic tract",
  "F": "Fornix",
  "ML": "Medial lemniscus",
  "OR": "Optic radiation",
  "RST": "Reticulospinal tract",
  "TR_A": "Anterior thalamic radiation",
  "TR_P": "Posterior thalamic radiation",
  "TR_S": "Superior thalamic radiation",
  "AC": "Anterior commissure",
  "CC": "Corpus callosum",
  "CB": "Cerebellar fibres (CB sample)",
  "ICP": "Inferior cerebellar peduncle",
  "MCP": "Middle cerebellar peduncle",
  "SCP": "Superior cerebellar peduncle",
  "V": "Vermis",
  "CNII": "Cranial nerve II (optic)",
  "CNIII": "Cranial nerve III (oculomotor)",
  "CNV": "Cranial nerve V (trigeminal)",
  "CNVII": "Cranial nerve VII (facial)",
  "CNVIII": "Cranial nerve VIII (vestibulocochlear)"
});
/** Publisher workbook names, verbatim (searchable aliases; never displayed as the label). */
export const SOURCE_NAMES=Object.freeze({
  "AF": "Arcuate Fasciculus","C_FPH": "Cingulum Frontal Parahippocampal","C_FP": "Cingulum Frontal Parietal",
  "C_PHP": "Cingulum Parahippocampal Parietal","C_PH": "Cingulum Parahippocampal","C_PO": "Cingulum Parolfactory",
  "EMC": "Extreme Capsule","FAT": "Frontal Aslant Tract","IFOF": "Inferior Fronto Occipital Fasciculus",
  "ILF": "Inferior Longitudinal Fasciculus","MdLF": "Middle Longitudinal Fasciculus","PAT": "Parietal Aslant Tract",
  "SLF1": "Superior Longitudinal Fasciculus1","SLF2": "Superior Longitudinal Fasciculus2","SLF3": "Superior Longitudinal Fasciculus3",
  "UF": "Uncinate Fasciculus","VOF": "Vertical Occipital Fasciculus","AR": "Acoustic Radiation","CBT": "Corticobulbar Tract",
  "CPT_F": "Corticopontine Tract Frontal","CPT_P": "Corticopontine Tract Parietal","CPT_O": "Corticopontine Tract Occipital",
  "CS_A": "Corticostriatal Tract Anterior","CS_S": "Corticostriatal Tract Superior","CS_P": "Corticostriatal Tract Posterior",
  "CST": "Cortico Spinal Tract","DRTT": "Dentatorubrothalamic Tract","F": "Fornix","ML": "Medial Lemniscus","OR": "Optic Radiation",
  "RST": "Reticulospinal Tract","TR_A": "Thalamic Radiation Anterior","TR_P": "Thalamic Radiation Posterior","TR_S": "Thalamic Radiation Superior",
  "AC": "Anterior Commissure","CC": "Corpus Callosum","CB": "Cerebellum","ICP": "Inferior Cerebellar Peduncle","MCP": "Middle Cerebellar Peduncle",
  "SCP": "Superior Cerebellar Peduncle","V": "Vermis","CNII": "Cranial nerve II (optic)","CNIII": "Cranial nerve III (oculomotor)",
  "CNV": "Cranial nerve V (trigeminal)","CNVII": "Cranial nerve VII (facial)","CNVIII": "Cranial nerve VIII (vestibulocochlear)"
});
export function bundleAliases(id){
  const family=/_[LR]$/.test(id)?id.slice(0,-2):id;
  return [SOURCE_NAMES[family],family.replaceAll('_',' ')].filter(Boolean).join(' ');
}
export function bundleLabel(id){
  const sided=/_[LR]$/.test(id),family=sided?id.slice(0,-2):id;
  const name=BUNDLE_NAMES[family]||family;
  return `${name}${id.endsWith('_L')?' · left':id.endsWith('_R')?' · right':''}`;
}
