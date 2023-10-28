set Valves;

param flowRate{v in Valves} integer;
param T integer;
param tunnelPresent{v1 in Valves, v2 in Valves} binary;
param startPosition{v in Valves} binary;

var currentPositionAtValve{t in 1..T, v in Valves} binary;
var openingValveAtTime{t in 1..T, v in Valves} binary;
var releasingPressure{t in 1..T, v in Valves} integer, >= 0;
var valveIsOpenAtTime{t in 1..T, v in Valves} binary;

maximize output: sum{t in 1..T} sum{v in Valves} releasingPressure[t, v];
s.t. movementInTunnels{v1 in Valves, v2 in Valves, t in 1..T-1}:
	currentPositionAtValve[t, v1] + currentPositionAtValve[t+1, v2] <=
		1 + tunnelPresent[v1, v2];
s.t. noSplitting{t in 1..T}: sum{v in Valves} currentPositionAtValve[t, v] = 1;
s.t. initialPosition{v in Valves}: currentPositionAtValve[1, v] = startPosition[v];
s.t. openingValveTakesTime{t in 1..T-1, v in Valves}:
	2*(-valveIsOpenAtTime[t, v] + valveIsOpenAtTime[t+1, v]) <=
		currentPositionAtValve[t, v] + currentPositionAtValve[t+1, v];
s.t. noClosingValves{t in 1..T-1, v in Valves}:
	valveIsOpenAtTime[t+1, v] >= valveIsOpenAtTime[t, v];
s.t. pressureRelease{t in 1..T, v in Valves}:
	releasingPressure[t, v] = flowRate[v] * valveIsOpenAtTime[t, v];
s.t. initiallyClosed{v in Valves}:
	valveIsOpenAtTime[1, v] = 0;

data;

set Valves := AA BB CC DD EE FF GG HH II JJ;
param flowRate :=
AA 0
BB 13
CC 2
DD 20
EE 3
FF 0
GG 0
HH 22
II 0
JJ 21;
param T := 30;
param tunnelPresent : AA BB CC DD EE FF GG HH II JJ :=
                    AA  1  1  0  1  0  0  0  0  1  0
                    BB  1  1  1  0  0  0  0  0  0  0
                    CC  0  1  1  1  0  0  0  0  0  0
                    DD  1  0  1  1  1  0  0  0  0  0
                    EE  0  0  0  1  1  1  0  0  0  0
                    FF  0  0  0  0  1  1  1  0  0  0
                    GG  0  0  0  0  0  1  1  1  0  0
                    HH  0  0  0  0  0  0  1  1  0  0
                    II  1  0  0  0  0  0  0  0  1  1
                    JJ  0  0  0  0  0  0  0  0  1  1
;
param startPosition :=
AA 1
BB 0
CC 0
DD 0
EE 0
FF 0
GG 0
HH 0
II 0
JJ 0;
