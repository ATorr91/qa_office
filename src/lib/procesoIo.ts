// Files each stage needs to start (inputs) and must leave delivered (outputs) live with the stage (proceso/stages/*.ts). The
// outputs of one stage are the inputs of the next, linked by `from` and `usedIn`.
import type { ProcessStage, StageId, StageIo } from "./procesoTypes";

export const ioOf = (stage: Pick<ProcessStage, "io">): StageIo => stage.io;

/** Id used to remember (in this browser) that a file was received or delivered. Starts with the stage id so "Limpiar marcas" clears it too. */
export const ioItemId = (stageId: StageId, side: "in" | "out", index: number) => `${stageId}:io-${side}:${index}`;
