#!/usr/bin/env python3

import sys
import json
import os.path
import matplotlib as mpl
import pandas as pd
import numpy as np
import scipy.sparse.csgraph as csg

usage = """\
path finding in json mesh files

usage:
  dijkstra infile.json [outfile.csv]
"""
if len(sys.argv) < 2:
    print(usage)
    sys.exit(1)
infile = sys.argv[1]
filename = infile.rsplit('/', 1)[1].split('.')[0]
if len(sys.argv) == 2:
    outfile = infile.replace('.json', '-analyzed.csv')
else:
    infile = sys.argv[2]

with open(infile) as fh:
    mesh_series = json.load(fh)

analysis = [{
    'average_distance_to_router': 0,
    'number_of_connected_nodes': 0,
    'number_of_total_nodes': 0,
    'connected_components': 0
}]

for mesh in mesh_series:
    if not mesh:
        continue
    router = None
    ids = sorted(set(n['id'] for n in mesh))
    df = pd.DataFrame(0, index=ids, columns=ids)
    for node in mesh:
        if 'router' in node['roles']:
            router = node['id']
        df.at[node['id'], node['id']] = 0
        for proto in node['connections'].values():
            for peer in proto:
                if peer in ids:
                    df.at[node['id'], peer] = 1
    df.drop('signal', axis=0, inplace=True)
    df.drop('signal', axis=1, inplace=True)
    dist_matrix = csg.floyd_warshall(df, directed=False, unweighted=False)
    dm = pd.DataFrame(dist_matrix, index=ids, columns=ids)
    dm = dm.replace(np.inf, np.NaN)
    dm = dm.replace(0.0, np.NaN)
    dm = dm.dropna(axis=0, how='all')
    dm = dm.dropna(axis=1, how='all')
    dm = dm.replace(np.NaN, 0.0)
    connected_components, _ = csg.connected_components(dm.values)
    average_distance_to_router = dm.get(router).sum() / len(dm)
    analysis.append({
        'average_distance_to_router': average_distance_to_router,
        'number_of_connected_nodes': len(dm),
        'number_of_total_nodes': len(mesh),
        'connected_components': connected_components
    })

aframe = pd.DataFrame(analysis)

statsfile = infile.replace('.json', '.csv')
sframe = pd.read_csv(statsfile)
sframe.drop('BROADCAST_ADDRESS', 1, inplace=True)
sframe.drop('DEFAULT_SIGNAL_ADDRESS', 1, inplace=True)

outframe = aframe.join(sframe)
outframe.to_csv(outfile)
