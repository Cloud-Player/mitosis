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

conns = {}
for name, frame in zip(names, frames):
    in_count = frame['totalInCount']
    out_count = frame['totalOutCount']
    target = np.zeros(101)
    target[:len(in_count)] += (in_count.values + out_count.values)
    conns[name] = target
    conns[name + '_pt'] = np.zeros(101)

outfile = '{}/{}-io.csv'.format(folder, folder.rsplit('/')[-1])
df = pd.DataFrame(conns)
df.to_csv(outfile)
print('saved to {}'.format(outfile))
