import csv
import sys

file = sys.argv[1]
domain = sys.argv[2]

f = open(file)
csv = csv.reader(f)

next(csv, None) # skip headers
for row in csv:

    name = "2016-02-04-" + str(row[3]).replace(" ", "-") + ".html"
    name = name.replace(":", "")
    out = open(name, 'w')

    out.write("---\n")
    out.write("layout: page\n")
    out.write("title: '" + row[3] + "'\n")
    out.write("categories: " + str(domain) + "\n")
    out.write("author: " + "'" + row[0] + "'\n")
    out.write("---\n")
    out.write("<h1>{{ page.title }}</h1>\n")
