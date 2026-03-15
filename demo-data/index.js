// Central index for all demo data files
// Each module has sample files (persistent objects) plus legacy flat data

import { pricingCalculatorDummy, pricingCalculatorFiles } from "./pricing-calculator.js";
import { proposalGeneratorDummy, proposalGeneratorFiles } from "./proposal-generator.js";
import { designExtractorFiles } from "./design-extractor.js";

// Legacy flat format (backward compat for existing views)
const DUMMY_DATA = {
  "pricing-calculator":  pricingCalculatorDummy,
  "proposal-generator":  proposalGeneratorDummy,
};

// New file-based format — each module has an array of saved file objects
const SAMPLE_FILES = {
  "pricing-calculator":  pricingCalculatorFiles,
  "proposal-generator":  proposalGeneratorFiles,
  "design-extractor":    designExtractorFiles,
};

export { SAMPLE_FILES };
export default DUMMY_DATA;
