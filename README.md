[![Build Status](https://travis-ci.org/auxdotapp/mitosis.svg?branch=master)](https://travis-ci.org/auxdotapp/mitosis)
[![TypeScript](https://img.shields.io/badge/lang-TypeScript-blue.svg)](https://www.typescriptlang.org)
[![WebRTC](https://img.shields.io/badge/tech-WebRTC-ff69b4.svg)](https://www.typescriptlang.org)
[![License](https://img.shields.io/github/license/auxdotapp/mitosis.svg)](https://github.com/auxdotapp/mitosis/blob/master/LICENSE)

# mitosis

software suite for building decentralised media streaming applications    
includes library, evaluators, simulator, visualizer and sample applications

```bash
[brew|apt|yum] install node python3 redis
```

## cli
command line client for benchmarking mitosis simulations
```bash
npm install
pip3 install -r requirements.txt

./cli scenario.json bench.csv
./analyzer.py bench.csv
```

## mitosis
mesh networking library for browser-to-browser streaming
```bash
npm install
```

## nucleus
granular webrtc experiments to verify mitosis video transfer
```bash
npm install

npm start
```

## signal
mock implementation of mitosis signal for python setup
```bash
pip3 install -r requirements.txt

./server.py
```

## simulation
runtime library for simulating multiple mitosis clients
```bash
npm install
```

## symbiosis
advanced video chat sample application built with mitosis
```bash
npm install

npm start
```

## symbiosis-light
dependency free video chat application built with mitosis
```bash
npm install

npm start
```

## visualization
graphical mesh visualizer using angular and d3js
```
npm install

npm start
```
