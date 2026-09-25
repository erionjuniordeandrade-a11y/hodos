// Test fixture only: motor-cst teach-back terms and transcripts for the matcher tests.
// Copied verbatim from the orchestrator's reviewed content draft; NOT authored lesson data.
export const TERMS=[
 {
  "step": 0,
  "terms": [
   {
    "id": "central-sulcus",
    "label": "Central sulcus",
    "en": [
     "central sulcus",
     "rolandic sulcus",
     "sulcus of rolando",
     "fissure of rolando",
     "rolandic fissure"
    ],
    "pt": [
     "sulco central",
     "sulco de rolando",
     "sulco rolândico",
     "sulco rolandico",
     "fissura de rolando"
    ]
   },
   {
    "id": "precentral-bank",
    "label": "Precentral gyrus (area 4) as the anterior bank",
    "en": [
     "precentral gyrus",
     "area 4",
     "area four",
     "primary motor cortex"
    ],
    "pt": [
     "giro pré-central",
     "giro precentral",
     "área 4",
     "área quatro",
     "córtex motor primário",
     "área motora primária"
    ]
   },
   {
    "id": "postcentral-bank",
    "label": "Postcentral gyrus (area 3b) as the posterior bank",
    "en": [
     "postcentral gyrus",
     "area 3b",
     "area three b",
     "primary somatosensory cortex",
     "somatosensory cortex",
     "area 3 b"
    ],
    "pt": [
     "giro pós-central",
     "giro poscentral",
     "área 3b",
     "área três b",
     "córtex somatossensitivo",
     "córtex somatossensorial",
     "córtex somestésico",
     "área 3 b",
     "somatosensitivo"
    ]
   }
  ]
 },
 {
  "step": 4,
  "terms": [
   {
    "id": "posterior-limb",
    "label": "Posterior limb of the internal capsule",
    "en": [
     "posterior limb",
     "posterior limb of the internal capsule",
     "PLIC"
    ],
    "pt": [
     "braço posterior",
     "braço posterior da cápsula interna",
     "ramo posterior da cápsula interna",
     "PLIC"
    ]
   },
   {
    "id": "thalamus-medial",
    "label": "Thalamus as the medial neighbour",
    "en": [
     "thalamus",
     "thalamic",
     "thalami"
    ],
    "pt": [
     "tálamo",
     "talâmico",
     "talâmica"
    ]
   },
   {
    "id": "lentiform-lateral",
    "label": "Lentiform complex (putamen + globus pallidus) as the lateral neighbour",
    "en": [
     "lentiform nucleus",
     "lentiform",
     "lenticular nucleus",
     "putamen",
     "globus pallidus",
     "pallidum"
    ],
    "pt": [
     "núcleo lentiforme",
     "lentiforme",
     "núcleo lenticular",
     "putâmen",
     "putamen",
     "globo pálido",
     "pálido"
    ]
   }
  ]
 },
 {
  "step": 9,
  "terms": [
   {
    "id": "level-cortical",
    "label": "Cortical level (primary motor vs premotor/postcentral)",
    "en": [
     "cortical level",
     "cortical cause",
     "cortical origin",
     "at the cortex",
     "at the surface"
    ],
    "pt": [
     "nível cortical",
     "causa cortical",
     "origem cortical",
     "no córtex",
     "na superfície"
    ]
   },
   {
    "id": "level-projection",
    "label": "Descending projection pathway (CST) at depth",
    "en": [
     "corticospinal tract",
     "corticospinal",
     "CST",
     "pyramidal tract",
     "descending pathway",
     "projection pathway"
    ],
    "pt": [
     "trato corticoespinhal",
     "trato corticospinal",
     "corticoespinhal",
     "corticospinal",
     "via piramidal",
     "trato piramidal",
     "feixe piramidal",
     "via descendente",
     "córtico-espinhal",
     "trato córtico-espinhal",
     "corticoespinal",
     "córtico-espinal"
    ]
   },
   {
    "id": "level-initiation",
    "label": "Medial premotor / initiation beyond area 4",
    "en": [
     "supplementary motor area",
     "supplementary motor",
     "SMA",
     "medial premotor",
     "motor initiation",
     "initiation of movement",
     "failure of initiation",
     "initiation failure",
     "akinesia"
    ],
    "pt": [
     "área motora suplementar",
     "motora suplementar",
     "AMS",
     "pré-motor medial",
     "premotor medial",
     "córtex pré-motor medial",
     "iniciação motora",
     "iniciação do movimento",
     "falha de iniciação",
     "dificuldade de iniciação",
     "início do movimento",
     "acinesia"
    ]
   },
   {
    "id": "level-cerebellar",
    "label": "Cerebellar coordination route (SCP / DRTT)",
    "en": [
     "cerebellum",
     "cerebellar",
     "superior cerebellar peduncle",
     "dentatorubrothalamic",
     "DRTT",
     "dentato-rubro-thalamic",
     "dentatothalamic",
     "dentatothalamocortical"
    ],
    "pt": [
     "cerebelo",
     "cerebelar",
     "pedúnculo cerebelar superior",
     "dentatorrubrotalâmico",
     "dentato-rubro-talâmico",
     "dentatorubrotalâmico",
     "dentatotalâmico",
     "DRTT"
    ]
   }
  ]
 }
];
export const T={
 "neg": "The deficit has to be placed somewhere along the route from the surface to the spinal cord.\nFirst you orient on the surface landmarks, then you look deeper, then you think about the wider network that plans and coordinates movement.\nA preserved outline on the atlas does not tell you what the patient can actually do.",
 "ptPos": "O sulco central separa o giro pré-central, a área 4, à frente, do giro pós-central, a área 3b, atrás.\nNa profundidade, o trato corticoespinhal passa pelo braço posterior da cápsula interna, entre o tálamo medialmente e o núcleo lentiforme lateralmente.\nUm déficit motor pode ser explicado no nível cortical, na via piramidal, na área motora suplementar como falha de iniciação, ou no circuito cerebelar pelo pedúnculo cerebelar superior.",
 "enOmit2": "The central sulcus has the precentral gyrus, area 4, in front and the postcentral gyrus behind it.\nDeeper, the corticospinal tract runs in the posterior limb of the internal capsule, with the lentiform nucleus lateral to it.\nA motor deficit can arise at the cortical level, in the descending pathway, or from the supplementary motor area as a failure of initiation.",
 "nearMiss": "The posterior ramus of the Sylvian fissure, the hypothalamus, sub-cortical fibres, steroid initiation and the M1 segment were discussed. O ramo posterior da fissura sylviana e o sulco pré-central também."
};
