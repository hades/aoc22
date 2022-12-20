import { ProblemOutput } from "./types";
import { readAllLines } from "./util";
import { loadModule, Model, Variable } from "glpk-ts";

type Blueprint = {
    id: number;
    oreRobotCostOre: number,
    clayRobotCostOre: number,
    obsidianRobotCostOre: number,
    obsidianRobotCostClay: number,
    geodeRobotCostOre: number,
    geodeRobotCostObsidian: number,
}

// Parses blueprint definition, which is a list of lines of the form:
// Blueprint 1:
//   Each ore robot costs 3 ore.
//   Each clay robot costs 4 ore.
//   Each obsidian robot costs 2 ore and 20 clay.
//   Each geode robot costs 4 ore and 7 obsidian.
function parseBlueprint(input: string): Blueprint {
    const match = input.match(new RegExp(
        'Blueprint ([0-9]+): Each ore robot costs ([0-9]+) ore. ' +
        'Each clay robot costs ([0-9]+) ore. ' + 
        'Each obsidian robot costs ([0-9]+) ore and ([0-9]+) clay. ' + 
        'Each geode robot costs ([0-9]+) ore and ([0-9]+) obsidian.'));
    if (!match) {
        throw new Error('invalid blueprint: ' + input);
    }
    return {
        id: parseInt(match[1], 10),
        oreRobotCostOre: parseInt(match[2], 10),
        clayRobotCostOre: parseInt(match[3], 10),
        obsidianRobotCostOre: parseInt(match[4], 10),
        obsidianRobotCostClay: parseInt(match[5], 10),
        geodeRobotCostOre: parseInt(match[6], 10),
        geodeRobotCostObsidian: parseInt(match[7], 10),
    };
}

function blueprintToGlpkModel(blueprint: Blueprint): Model {
    // The model below is equivalent to the following MathProg model:
    // set O;
    // param robotCost{r in O, o in O} integer;
    // param initialOreRobots{r in O} integer;
    // param T integer;
    // param goal{o in O} integer;
    // var x{r in O, t in 1..T} binary;
    // maximize output: sum{o in O} ((sum{j in 1..T-1} x[o, T-j] * j) +
    //          initialOreRobots[o] * T) * goal[o];
    // s.t. totalRobotCost{o in O, t in 1..T}:
    //          sum{r in O} sum{i in 1..t} robotCost[r, o] * x[r, i] <=
    //              (sum{j in 1..t-2} x[o, t-1-j] * j) + initialOreRobots[o] * (t-1);
    // s.t. maximumPurchases{t in 1..T}: sum{r in O} x[r, t] <= 1;
    // 
    // data;
    // set O := ore clay obsidian geode;
    // param robotCost:           ore clay obsidian geode :=
    //                  ore       2   0    0        0
    //                  clay      3   0    0        0
    //                  obsidian  3   8    0        0
    //                  geode     3   0    12       0;
    // param initialOreRobots:= ore      1
    //                          clay     0
    //                          obsidian 0
    //                          geode    0;
    // param T := 24;
    // param goal:= ore      0
    //              clay     0
    //              obsidian 0
    //              geode    1;
    const result = new Model();
    const oreRobots: Variable[] = [];
    const clayRobots: Variable[] = [];
    const obsidianRobots: Variable[] = [];
    const geodeRobots: Variable[] = [];
    for (let t = 1; t <= 24; t++) {
        const [makeOreRobot, makeClayRobot, makeObsidianRobot, makeGeodeRobot] =
            result.addVars(4, { type: 'binary' });
        makeOreRobot.name = `x(ore,${t})`;
        makeClayRobot.name = `x(clay,${t})`;
        makeObsidianRobot.name = `x(obsidian,${t})`;
        makeGeodeRobot.name = `x(geode,${t})`;
        oreRobots.push(makeOreRobot);
        clayRobots.push(makeClayRobot);
        obsidianRobots.push(makeObsidianRobot);
        geodeRobots.push(makeGeodeRobot);

        // Geode robots generate 1 geode per tick, so that they contribute
        // 24 - t geodes to the total output.
        makeGeodeRobot.obj = (24 - t);

        // We can only buy one robot per tick.
        result.addConstr({
            name: `maximumPurchases(${t})`,
            ub: 1,
            coeffs: [
                [makeOreRobot, 1],
                [makeClayRobot, 1],
                [makeObsidianRobot, 1],
                [makeGeodeRobot, 1],
            ],
        });

        // The following function computes the coefficients for the constraints
        // on the total mined resources. Each robot contributes a certain amount
        // of resource (starting two ticks after it was purchased), but costs
        // resources to purchase (starting at the tick it was purchased).
        const robotCoefficients = function*(
                robots: Variable[], costToBuild: number, resourceProduced: boolean):
                    Generator<[Variable, number], void, void> {
            for (let tPast = 1; tPast <= t; tPast++) {
                let coeff = costToBuild;
                if (resourceProduced && t - tPast >= 2) {
                    coeff -= (t - tPast - 1);
                }
                yield [robots[tPast - 1], coeff];
            }
        };
        result.addConstr({
            name: `totalRobotCost(ore,${t})`,
            coeffs: [
                ...robotCoefficients(oreRobots, blueprint.oreRobotCostOre, true),
                ...robotCoefficients(clayRobots, blueprint.clayRobotCostOre, false),
                ...robotCoefficients(obsidianRobots, blueprint.obsidianRobotCostOre, false),
                ...robotCoefficients(geodeRobots, blueprint.geodeRobotCostOre, false),
            ],
            // The initial free ore robot will produce this much ore.
            ub: (t-1),
        });
        result.addConstr({
            name: `totalRobotCost(clay,${t})`,
            coeffs: [
                ...robotCoefficients(obsidianRobots, blueprint.obsidianRobotCostClay, false),
                ...robotCoefficients(clayRobots, 0, true),
            ],
            ub: 0,
        });
        result.addConstr({
            name: `totalRobotCost(obsidian,${t})`,
            coeffs: [
                ...robotCoefficients(geodeRobots, blueprint.geodeRobotCostObsidian, false),
                ...robotCoefficients(obsidianRobots, 0, true),
            ],
            ub: 0,
        });
    }
    result.sense = 'max';
    return result;
}

function blueprintToGlpkModelStar2(blueprint: Blueprint): Model {
    const result = new Model();
    const oreRobots: Variable[] = [];
    const clayRobots: Variable[] = [];
    const obsidianRobots: Variable[] = [];
    const geodeRobots: Variable[] = [];
    for (let t = 1; t <= 32; t++) {
        const [makeOreRobot, makeClayRobot, makeObsidianRobot, makeGeodeRobot] =
            result.addVars(4, { type: 'binary' });
        makeOreRobot.name = `x(ore,${t})`;
        makeClayRobot.name = `x(clay,${t})`;
        makeObsidianRobot.name = `x(obsidian,${t})`;
        makeGeodeRobot.name = `x(geode,${t})`;
        oreRobots.push(makeOreRobot);
        clayRobots.push(makeClayRobot);
        obsidianRobots.push(makeObsidianRobot);
        geodeRobots.push(makeGeodeRobot);

        // Geode robots generate 1 geode per tick, so that they contribute
        // 32 - t geodes to the total output.
        makeGeodeRobot.obj = (32 - t);

        // We can only buy one robot per tick.
        result.addConstr({
            name: `maximumPurchases(${t})`,
            ub: 1,
            coeffs: [
                [makeOreRobot, 1],
                [makeClayRobot, 1],
                [makeObsidianRobot, 1],
                [makeGeodeRobot, 1],
            ],
        });

        // The following function computes the coefficients for the constraints
        // on the total mined resources. Each robot contributes a certain amount
        // of resource (starting two ticks after it was purchased), but costs
        // resources to purchase (starting at the tick it was purchased).
        const robotCoefficients = function*(
                robots: Variable[], costToBuild: number, resourceProduced: boolean):
                    Generator<[Variable, number], void, void> {
            for (let tPast = 1; tPast <= t; tPast++) {
                let coeff = costToBuild;
                if (resourceProduced && t - tPast >= 2) {
                    coeff -= (t - tPast - 1);
                }
                yield [robots[tPast - 1], coeff];
            }
        };
        result.addConstr({
            name: `totalRobotCost(ore,${t})`,
            coeffs: [
                ...robotCoefficients(oreRobots, blueprint.oreRobotCostOre, true),
                ...robotCoefficients(clayRobots, blueprint.clayRobotCostOre, false),
                ...robotCoefficients(obsidianRobots, blueprint.obsidianRobotCostOre, false),
                ...robotCoefficients(geodeRobots, blueprint.geodeRobotCostOre, false),
            ],
            // The initial free ore robot will produce this much ore.
            ub: (t-1),
        });
        result.addConstr({
            name: `totalRobotCost(clay,${t})`,
            coeffs: [
                ...robotCoefficients(obsidianRobots, blueprint.obsidianRobotCostClay, false),
                ...robotCoefficients(clayRobots, 0, true),
            ],
            ub: 0,
        });
        result.addConstr({
            name: `totalRobotCost(obsidian,${t})`,
            coeffs: [
                ...robotCoefficients(geodeRobots, blueprint.geodeRobotCostObsidian, false),
                ...robotCoefficients(obsidianRobots, 0, true),
            ],
            ub: 0,
        });
    }
    result.sense = 'max';
    return result;
}

export async function dec19(input: NodeJS.ReadableStream): Promise<ProblemOutput> {
    await loadModule();
    const blueprints = (await readAllLines(input)).map(parseBlueprint);
    const solve: (b: Blueprint) => number = (blueprint: Blueprint) => {
        const model = blueprintToGlpkModel(blueprint);
        model.simplex();
        model.intopt();
        const quality = blueprint.id * model.valueMIP;
        return quality;
    };
    //const results = blueprints.map(solve);
    let totalQuality = 0;
    for (const result of []) {
        totalQuality += result;
    }
    const solveStar2: (b: Blueprint) => number = (blueprint: Blueprint) => {
        const model = blueprintToGlpkModelStar2(blueprint);
        model.simplex();
        model.intopt();
        return model.valueMIP;
    };
    const resultsStar2 = blueprints.slice(0, 3).map(solveStar2).reduce((a, b) => a * b, 1);
    return {
        firstStar: totalQuality.toString(),
        secondStar: resultsStar2.toString(),
    };
}