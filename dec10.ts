import { ProblemOutput } from "./types";
import { readAllLines } from "./util";

export async function dec10(input: NodeJS.ReadableStream): Promise<ProblemOutput> {
  const lines = await readAllLines(input);
  let cycle = 0;
  let regX = 1;
  let history: number[] = [];
  for (const line of lines) {
    const [command, param] = line.split(" ");
    if (command === "noop") {
        history[cycle + 1] = regX;
        cycle += 1;
        continue;
    }
    if (command === "addx") {
        history[cycle + 1] = regX;
        history[cycle + 2] = regX;
        regX += parseInt(param);
        cycle += 2;
        continue;
    }
  }
  let sum = 0;
  for (let i = 20; history[i] !== undefined; i += 40) {
    sum += history[i] * i;
  }
  let text: string[] = [];
  for (let row = 0; row < 6; row++) {
    text.push("");
    for (let col = 0; col < 40; col++) {
        if (Math.abs(history[row * 40 + col + 1] - col) <= 1) {
            text[row] += "█";
        } else {
            text[row] += "░";
        }
    }
  }
  return { firstStar: sum.toString(), secondStar: text.join('\n') };
}