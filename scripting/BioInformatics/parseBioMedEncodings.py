import csv
import sys

file = sys.argv[1]

f = open(file)
csv = csv.reader(f)

spatialNames = ['Choropleth / Heatmap',	'Ball and Stick / Mesh', 'Isosurface / Streamlines', 'Volume / Images',	'Glyph',	'Animation']
nonSpatialNames = '\t'.join(['Encoding', 'Color', 'Label with Text', 'Bar Chart',	'Line Chart',  'Sequence', 'Pie Chart', 'Histogram',	'Scatterplot', 'Box-Plot',	'Node-Link', 'SPLOM',	'PCP',	'Star-Plot', 'TreeMap'])

Matrix = [[0 for x in range(14)] for x in range(6)]

# print Matrix
count = 0

next(csv, None) # skip headers
for row in csv:
    spatial = []
    nonSpatial = []
    for col in range(0,len(row)):
        if col < 7 and col > 0 and row[col] == 'X':
            spatial.append(col)
        elif col > 6 and row[col] == 'X':
            nonSpatial.append(col)

    # print nonSpatial

    # combine the encodings into a single matrix of spatial vs nonSpatial
    for s in spatial:
        for n in nonSpatial:
            x = int(s)-1
            y = int(n)-7
            Matrix[x][y] += 1

print nonSpatialNames
for i in range(0,len(Matrix)):
    row = '\t'.join(map(str, Matrix[i]))
    print spatialNames[i] + '\t' + row
