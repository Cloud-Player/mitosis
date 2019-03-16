#!/usr/bin/env python3

import sys
import json
import glob
import os.path
import matplotlib as mpl
import pandas as pd
import numpy as np
import scipy.sparse.csgraph as csg

if len(sys.argv) < 2:
    print(usage)
    sys.exit(1)
folder = sys.argv[1].rstrip('/')
tables = glob.glob('{}/*-analyzed.csv'.format(folder))
print('loading {}'.format(', '.join(t.rsplit('/')[-1] for t in tables)))
frames = [pd.read_csv(t) for t in tables]
names = [t.split('/')[-1].split('-')[0] for t in tables]

ingress = {}

for name, frame in zip(names, frames):
    total = frame['number_of_total_nodes']
    connected = frame['number_of_connected_nodes']
    ingress[name] = connected

outfile = '{}/{}-ingress.csv'.format(folder, folder.rsplit('/')[-1])
iframe = pd.DataFrame(ingress)
iframe.to_csv(outfile)
print('saved to {}'.format(outfile))
