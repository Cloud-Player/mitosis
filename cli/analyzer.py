#!/usr/bin/env python3

import sys
import json
import os.path
import matplotlib as mpl
import pandas as pd
import numpy as np
import scipy.sparse.csgraph as csg
import scipy.spatial as spat

usage = """\
path finding in json mesh files

usage:
  analyzer infile.json
"""
if len(sys.argv) < 2:
    print(usage)
    sys.exit(1)
infile = sys.argv[1]
filename = infile.rsplit('/', 1)[1].split('.')[0]
sys.setrecursionlimit(10000)
afile = infile.replace('.json', '-analyzed.csv')
sfile = infile.replace('.json', '-stream.csv')
nfile = infile.replace('.json', '-nodes.csv')

with open(infile) as fh:
    mesh_series = json.load(fh)

analysis = [{
    'average_distance_to_router': 0,
    'number_of_connected_nodes': 0,
    'number_of_total_nodes': 0,
    'connected_components': 0
}]

stream_histos = []

node_details = {}

def clean_frame(df):
    df = df.replace(np.inf, np.NaN)
    df = df.replace(0.0, np.NaN)
    df = df.dropna(axis=0, how='all')
    df = df.dropna(axis=1, how='all')
    df = df.replace(np.NaN, 0.0)
    return df

for mesh_index, mesh in enumerate(mesh_series):
    if not mesh:
        continue
    router = None
    streamer = None
    ids = sorted(set(n['id'] for n in mesh if 'signal' not in n['id']))
    mesh_df = pd.DataFrame(0, index=ids, columns=ids)
    stream_df = pd.DataFrame(0, index=ids, columns=ids)
    for node in mesh:
        if node['id'] not in ids:
            continue
        node_info = node.copy()
        for role in node_info.pop('roles', []):
            node_info[role] = 1
        node_info['connection_count'] = len(node_info.pop('connections', []))
        node_info['channel_count'] = len(node_info.pop('channels', []))
        node_details[node_info.pop('id')] = node_info
        if 'router' in node['roles']:
            router = node['id']
        for channel in node['channels']:
            for provider in channel['providers']:
                if provider.get('isLocal'):
                    streamer = node['id']
        for proto, conns in node['connections'].items():
            for conn in conns:
                if isinstance(conn, str):
                    conn = {'id': conn, 'quality': 1.0, 'state': 'open'}
                if conn['id'] not in ids or conn['state'] != 'open':
                    continue
                if proto == 'webrtc-stream':
                    stream_df.at[node['id'], conn['id']] = 1
                else:
                    mesh_df.at[node['id'], conn['id']] = conn['quality']

    mesh_path = csg.dijkstra(mesh_df, directed=False, unweighted=True)
    dm = pd.DataFrame(mesh_path, index=ids, columns=ids)
    dm = clean_frame(dm)
    if dm.get(router, pd.Series([])).any():
        connected_components, _ = csg.connected_components(dm.values)
        average_distance_to_router = dm.get(router).sum() / len(dm)
        analysis.append({
            'average_distance_to_router': average_distance_to_router,
            'number_of_connected_nodes': len(dm),
            'number_of_total_nodes': len(mesh),
            'connected_components': connected_components
        })

        if mesh_index == len(mesh_series) - 1:
            for node_id, distance in dm.get(router).to_dict().items():
                node_details[node_id]['distance_to_router'] = distance

    if stream_df.size and stream_df.max().max():
        stream_path, predecessors = csg.dijkstra(
            stream_df, unweighted=True, return_predecessors=True)
        ds = pd.DataFrame(stream_path, index=ids, columns=ids)
        dss = clean_frame(ds).max()
        bins = int(pd.Series((dss.max(), 0)).max(skipna=True))
        histo, _ = np.histogram(dss, bins=range(bins + 2))
        stream_histos.append({k: v for k, v in zip(range(bins), histo)})

aframe = pd.DataFrame(analysis)

statsfile = infile.replace('.json', '.csv')
sframe = pd.read_csv(statsfile)
sframe.drop('BROADCAST_ADDRESS', 1, inplace=True)
sframe.drop('DEFAULT_SIGNAL_ADDRESS', 1, inplace=True)
jframe = aframe.join(sframe)
jframe.to_csv(afile)
print(jframe.head())
print('...\nsaved to {}'.format(afile))

if node_details:
    nframe = pd.DataFrame(node_details)
    nframe = nframe.transpose()
    nframe = clean_frame(nframe)
    nframe.to_csv(nfile)
    print(nframe.head())
    print('...\nsaved to {}'.format(nfile))

if stream_histos:
    sframe = pd.DataFrame(stream_histos)
    sframe = clean_frame(sframe)
    sframe.to_csv(sfile)
    print(sframe.head())
    print('...\nsaved to {}'.format(sfile))
