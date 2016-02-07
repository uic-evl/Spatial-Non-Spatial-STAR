import csv
import sys

file = sys.argv[1]

f = open(file)
csv = csv.reader(f)

spatialNames = ['Chloropleth Map / Heatmap',	'Volume / Images',	'Isosurface / Streamlines',	'Ball and Stake / Mesh']
nonSpatialNames = '\t'.join(['Encoding', 'Color', 'Label', 'Line Chart', 'Histogram', 'Scatterplot',
        'Box-and-Whisker',  'Node-link Diagram / Graph', 'Dendrogram', 'SPLOM', 'Parallel Coordinate Plot', 'Glyph', 'Star Coordinates', 'TreeMap'])

Matrix = [[0 for x in range(16)] for x in range(4)]

# print Matrix
count = 0

next(csv, None) # skip headers
for row in csv:
    spatial = []
    nonSpatial = []
    for col in range(0,len(row)):
        if col < 5 and col > 0 and row[col] == 'X':
            spatial.append(col)
        elif col > 4 and row[col] == 'X':
            nonSpatial.append(col)

    # combine the encodings into a single matrix of spatial vs nonSpatial
    for s in spatial:
        for n in nonSpatial:
            x = int(s)-1
            y = int(n)-5
            Matrix[x][y] += 1

print nonSpatialNames
for i in range(0,len(Matrix)):
    row = '\t'.join(map(str, Matrix[i]))
    print spatialNames[i] + '\t' + row
