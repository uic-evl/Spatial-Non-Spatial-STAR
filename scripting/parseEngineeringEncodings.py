import csv
import sys

file = sys.argv[1]

f = open(file)
csv = csv.reader(f)

spatialNames = ['Chloropleth Map / Heatmap',	'Volume / Images',	'Isosurface / Streamlines',	'Ball and Stake / Mesh',	'Glyph',	'Animation',	'Other']
nonSpatialNames = '\t'.join(['Encoding', 'Color',	'Line Chart',	'Histogram',	'Scatterplot',	'Node-link Diagram / Graph',	'Parallel Coordinate Plot',	'Star Coordinates'])

Matrix = [[0 for x in range(7)] for x in range(7)]

# print Matrix
count = 0

next(csv, None) # skip headers
for row in csv:
    spatial = []
    nonSpatial = []
    for col in range(0,len(row)):
        if col < 10 and col > 2 and row[col] == 'X': spatial.append(col)
        elif col > 9 and row[col] == 'X': nonSpatial.append(col)

    # combine the encodings into a single matrix of spatial vs nonSpatial
    for s in spatial:
        for n in nonSpatial:
            x = int(s)-3
            y = int(n)-10
            Matrix[x][y] += 1

print nonSpatialNames
for i in range(0,len(Matrix)):
    row = '\t'.join(map(str, Matrix[i]))
    print spatialNames[i] + '\t' + row
