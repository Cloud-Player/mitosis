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
mean all values of analyzed csvs in folder

usage:
  mean /path/to/folder
"""
if len(sys.argv) < 2:
    print(usage)
    sys.exit(1)
folder = sys.argv[1].rstrip('/')
tables = glob.glob('{}/*-analyzed.csv'.format(folder))
print('loading {}'.format(', '.join(t.rsplit('/')[-1] for t in tables)))
frames = [pd.read_csv(t) for t in tables]
for frame in frames:
    for key in ['maxInKB', 'maxOutCount', 'maxOutKB', 'maxInCount']:
        if key not in frame.keys():
            frame[key] = pd.Series(np.NaN, index=frame.index)

df_concat = pd.concat(frames, sort=False)
by_row_index = df_concat.groupby(df_concat.index)
df_means = by_row_index.mean()
outfile = '{}/mean.csv'.format(folder)
df_means.to_csv(outfile)
print('saved to {}'.format(outfile))
