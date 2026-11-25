import {TRACT_PROTOCOLS} from './testing_tracts_data.js';
import {CORTEX_PROTOCOLS} from './testing_cortex_data.js';

export {TRACT_PROTOCOLS, CORTEX_PROTOCOLS};
export const TARGET_PROTOCOLS = Object.freeze([...TRACT_PROTOCOLS, ...CORTEX_PROTOCOLS]);
