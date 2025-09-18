import { UnsafeApp } from "./types";
import { DatacoreApi } from "@blacksmithgu/datacore";

export function getDatacoreAPI(app: UnsafeApp): DatacoreApi | undefined {
  const api = app.plugins.plugins["datacore"]?.api;
  if (api) {
    return api as DatacoreApi;
  }
  return undefined;
}
