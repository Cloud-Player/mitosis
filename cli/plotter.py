#!/usr/bin/env python3

import sys
import os.path
import matplotlib as mpl
import pandas as pd

usage = """\
plot csv files with matplotlib

usage:
  plotter infile.csv [outfile.png]
"""
if len(sys.argv) < 2:
    print(usage)
    sys.exit(1)
infile = sys.argv[1]
filename = infile.rsplit('/', 1)[1].split('.')[0]
if len(sys.argv) == 2:
    outfile = os.path.expanduser('~/Desktop/{}.png'.format(filename))
else:
    infile = sys.argv[2]

df = pd.read_csv(infile)
df = df.set_index(sorted(df.keys())[0])
df.plot()
mpl.pyplot.savefig(outfile, bbox_inches='tight')
