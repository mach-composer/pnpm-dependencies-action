import * as core from "@actions/core";

import { run } from "./main";

const inputs = {
  packageName: core.getInput("package"),
};

// eslint-disable-next-line @typescript-eslint/no-floating-promises
run(inputs);
