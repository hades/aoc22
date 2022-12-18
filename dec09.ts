import { ProblemOutput } from "./types";
import { Coords, CoordsSet, readAllLines } from "./util";

function move(head: Coords, direction: string): void {
  switch (direction) {
    case "U":
      head.y += 1;
      break;
    case "D":
      head.y -= 1;
      break;
    case "L":
      head.x -= 1;
      break;
    case "R":
      head.x += 1;
      break;
  }
}

function adjust(head: Coords, tail: Coords): void {
  if (head.x === tail.x) {
    const vector = head.y - tail.y;
    if (Math.abs(vector) >= 2) {
        tail.y = head.y - Math.sign(vector);
    }
  } else if (head.y === tail.y) {
    const vector = head.x - tail.x;
    if (Math.abs(vector) >= 2) {
        tail.x = head.x - Math.sign(vector);
    }
  } else {
    let dx = head.x - tail.x;
    let dy = head.y - tail.y;
    while (Math.abs(dx) > 1 || Math.abs(dy) > 1) {
        tail.x += Math.sign(dx);
        tail.y += Math.sign(dy);
        dx = head.x - tail.x;
        dy = head.y - tail.y;
    }
  }
}

export async function dec09(input: NodeJS.ReadableStream): Promise<ProblemOutput> {
  const lines = await readAllLines(input);
  const knots: Coords[] = [...Array(10).keys()].map(() => { return { x: 0, y: 0 }; });
  const visited = new CoordsSet();
  const visitedStar2 = new CoordsSet();
  visited.add(knots[1]);
  visitedStar2.add(knots[9]);
  for (const line of lines) {
    const [direction, distance] = line.split(" ");
    for (let i = 0; i < parseInt(distance); i++) {
        move(knots[0], direction);
        for (let j = 1; j < 10; j++) {
            adjust(knots[j-1], knots[j]);
        }
        visited.add(knots[1]);
        visitedStar2.add(knots[9]);
    }
  }
  return {
    firstStar: visited.size.toString(),
    secondStar: visitedStar2.size.toString(),
  }
}