// Central index for all dummy data files
// Each sub-app has its own file in this folder

import { pricingCalculatorDummy } from "./pricing-calculator.js";
import { proposalGeneratorDummy } from "./proposal-generator.js";

const DUMMY_DATA = {
  "pricing-calc": pricingCalculatorDummy,
  "proposals":    proposalGeneratorDummy,
};

export default DUMMY_DATA;
