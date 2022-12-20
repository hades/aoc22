import { stat } from "fs";
import { ProblemOutput } from "./types";
import { readAllLines } from "./util";

type Valve = {
    flowRate: number,
    tunnelsTo: string[],
}

type ValveSystem = {
    [valveId: string]: Valve,
}

// Parses the valve system definition, which is a list of lines of the form:
//   Valve AA has flow rate=0; tunnels lead to valves DD, II, BB
function parseValveSystem(input: string[]): ValveSystem {
    const system: ValveSystem = {};
    for (const line of input) {
        const match = line.match(/Valve ([A-Z]+) has flow rate=([0-9]+); tunnels? leads? to valves? ([A-Z, ]+)/);
        if (!match) {
            throw new Error('invalid valve: ' + line);
        }
        system[match[1]] = {
            flowRate: parseInt(match[2], 10),
            tunnelsTo: match[3].split(', '),
        };
    }
    return system;
}

type State = {
    totalPressureRelease: number,
    openValves: readonly string[],
}

type Distances = {
    [sourceValve: string]: {
        [destinationValve: string]: number,
    }
}

// Computes all shortest paths in the valve system using Floyd-Warshall.
function floydWarshall(system: ValveSystem): Distances {
    const distances: Distances = {};
    for (const sourceValve of Object.keys(system)) {
        distances[sourceValve] = {};
        for (const destinationValve of Object.keys(system)) {
            if (sourceValve === destinationValve) {
                distances[sourceValve][destinationValve] = 0;
            } else if (system[sourceValve].tunnelsTo.includes(destinationValve)) {
                distances[sourceValve][destinationValve] = 1;
            } else {
                distances[sourceValve][destinationValve] = Infinity;
            }
        }
    }
    for (const intermediateValve of Object.keys(system)) {
        for (const sourceValve of Object.keys(system)) {
            for (const destinationValve of Object.keys(system)) {
                distances[sourceValve][destinationValve] = Math.min(
                        distances[sourceValve][destinationValve],
                        distances[sourceValve][intermediateValve] +
                        distances[intermediateValve][destinationValve]);
            }
        }
    }
    return distances;
}

function bestTotalOutflowWithElephant(system: ValveSystem, distances: Distances,
        tMe: number, tElephant: number, state: State, startMe: string,
        startElephant: string): number {
    let bestOutflow = state.totalPressureRelease;
    if (tMe >= 26 && tElephant >= 26) {
        return bestOutflow;
    }
    // Choose which valve to open next.
    for (const [valveId, valve] of Object.entries(system)) {
        if (state.openValves.includes(valveId)) {
            continue;
        }
        if (valve.flowRate === 0) {
            continue;
        }
        const valveOpenTimeMe = 26 - (tMe + distances[startMe][valveId] + 1);
        const valveOpenTimeElephant = 26 - (tElephant + distances[startElephant][valveId] + 1);
        if (valveOpenTimeMe > 0 && valveOpenTimeMe >= valveOpenTimeElephant) {
            bestOutflow = Math.max(bestOutflow, bestTotalOutflowWithElephant(
                system, distances, tMe + distances[startMe][valveId] + 1,
                tElephant,
                {
                    totalPressureRelease: state.totalPressureRelease +
                        valve.flowRate * valveOpenTimeMe,
                    openValves: [...state.openValves, valveId],
                },
                valveId, startElephant));
        }
        if (valveOpenTimeElephant > 0 && valveOpenTimeElephant >= valveOpenTimeMe) {
            bestOutflow = Math.max(bestOutflow, bestTotalOutflowWithElephant(
                system, distances, tMe,
                tElephant + distances[startElephant][valveId] + 1,
                {
                    totalPressureRelease: state.totalPressureRelease +
                        valve.flowRate * valveOpenTimeElephant,
                    openValves: [...state.openValves, valveId],
                },
                startMe, valveId));
        }
    }
    return bestOutflow;
}

function bestTotalOutflow(system: ValveSystem, distances: Distances,
        t: number, state: State, startValve: string): number {
    let bestOutflow = state.totalPressureRelease;
    if (t === 30) {
        return bestOutflow;
    }
    // Choose which valve to open next.
    for (const [valveId, valve] of Object.entries(system)) {
        if (state.openValves.includes(valveId)) {
            continue;
        }
        if (valve.flowRate === 0) {
            continue;
        }
        const valveOpenTime = 30 - (t + distances[startValve][valveId] + 1);
        if (valveOpenTime <= 0) {
            continue;
        }
        bestOutflow = Math.max(bestOutflow, bestTotalOutflow(
            system, distances, t + distances[startValve][valveId] + 1,
            {
                totalPressureRelease: state.totalPressureRelease +
                    valve.flowRate * valveOpenTime,
                openValves: [...state.openValves, valveId],
            },
            valveId));
    }
    return bestOutflow;
}

export async function dec16(input: NodeJS.ReadableStream): Promise<ProblemOutput> {
    const system = parseValveSystem(await readAllLines(input));
    const distances = floydWarshall(system);
    return {
        firstStar: bestTotalOutflow(
            system, distances, 0, {totalPressureRelease: 0, openValves: []},
            'AA').toString(),
        secondStar: bestTotalOutflowWithElephant(
            system, distances, 0, 0, {totalPressureRelease: 0, openValves: []}, 'AA', 'AA').toString(
        )
    };
}