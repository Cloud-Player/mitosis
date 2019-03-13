#!/usr/bin/env python3

import sys
import json
import glob
import os.path
import matplotlib as mpl
import pandas as pd
import numpy as np
import scipy.sparse.csgraph as csg

usage = """\
node details to histogram converter

usage:
  nodes /path/to/folder
"""
if len(sys.argv) < 2:
    print(usage)
    sys.exit(1)
folder = sys.argv[1].rstrip('/')
tables = glob.glob('{}/*-nodes.csv'.format(folder))
print('loading {}'.format(', '.join(t.rsplit('/')[-1] for t in tables)))
frames = [pd.read_csv(t) for t in tables]
df = pd.concat(frames, sort=False)
df = df[['distance_to_router', 'latency', 'stability']]
df = df.where(lambda x: x['distance_to_router'] > 0)
df = df.dropna(axis=0, how='all')
summary = {}
distances = sorted(set(df['distance_to_router']))
for d in distances:
    dd = df.where(lambda x: x['distance_to_router']== d)
    dd = dd.dropna(axis=0, how='all')
    summary[d] = {
        'latency': dd['latency'].mean(),
        'stabilty': dd['stability'].mean()
    }

sf = pd.DataFrame(summary).transpose()
outfile = '{}/{}-histogram.csv'.format(folder, folder.rsplit('/')[-1])
sf.to_csv(outfile)
print(sf.head())
print('...\nsaved to {}'.format(outfile))
