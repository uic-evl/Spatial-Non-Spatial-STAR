import csv
import sys

file = sys.argv[1]

f = open(file)
csv = csv.reader(f)

spatialNames = ['Ball and Stake/Mesh',	'Isosurface/Streamlines' ,'Volume/Images', 'Glyph', "Animation"]
nonSpatialNames = '\t'.join(['Encoding', 'Bar Chart', 'Line Chart', 'Sequence', 'Pie Chart', 'Histogram', 'Scatterplot',
        'Box Plot',  'Graph-Based', 'Heatmap', 'PCP'])

Matrix = [[0 for x in range(13)] for x in range(5)]

# print Matrix
count = 0

next(csv, None) # skip headers
for row in csv:
    spatial = []
    nonSpatial = []
    for col in range(0,len(row)):
        if col < 6 and col > 0 and row[col] == 'X':
            spatial.append(col)
        elif col > 5 and row[col] == 'X':
            nonSpatial.append(col)

    # combine the encodings into a single matrix of spatial vs nonSpatial
    for s in spatial:
        for n in nonSpatial:
            x = int(s)-1
            y = int(n)-6
            Matrix[x][y] += 1

print nonSpatialNames
for i in range(0,len(Matrix)):
    row = '\t'.join(map(str, Matrix[i]))
    print spatialNames[i] + '\t' + row
