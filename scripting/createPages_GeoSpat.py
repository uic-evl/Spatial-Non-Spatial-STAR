import csv
import sys

def toString(a):
    s="["
    for el in a:
        s+=el+","
    if (s[-1]==","):
        s = s[:-1]
    s+="]"
    return s

file = sys.argv[1]
eval = sys.argv[2]
inter = sys.argv[3]
enc = sys.argv[4]
tasks = sys.argv[5]
domain = sys.argv[6]

f = open(file)
file = csv.reader(f)

f = open(eval)
eval = csv.reader(f)

f = open(inter)
inter = csv.reader(f)

f = open(enc)
enc = csv.reader(f)

f = open(tasks)
tasks = csv.reader(f)

i=1
#next(csv, None) # skip headers

eval.next()
intHead = inter.next()
intHead[9] = "Domain Experts"
encHead = enc.next()
taskHead = tasks.next()
for row in file:

    evrow = eval.next()
    intRow = inter.next()
    encRow = enc.next()
    taskRow = tasks.next()


    name = "2016-02-04-" + str(row[0]).replace(" ", "-") + ".html"
    name = name.replace(":", "")
    out = open(name, 'w')

    out.write("---\n")
    out.write("layout: page\n")
    out.write("title: '" + row[1] + "'\n")
    out.write("categories: " + str(domain) + "\n")
    out.write("dataType: "+ row[8] + "\n")
    out.write("typeEnc: "+ row[11] + "\n")
    out.write("summary: \""+ str(row[24]) + "\"\n")
    out.write("nOfUsers: "+ evrow[1] + "\n")
    out.write("expertise: "+ evrow[2] + "\n")
    out.write("typeOfEval: "+ evrow[4] + "\n")

    out.write("interactionPattern: ")
    arr = []
    for j in range(2,7):
        if (intRow[j] != "") :
            arr.append(intHead[j])
    out.write(toString(arr))
    out.write("\n")

    out.write("testerExpertise: ")
    arr = []
    for j in range(8,10):
        if (intRow[j] != "") :
            arr.append(intHead[j])
    out.write(toString(arr))
    out.write("\n")

    out.write("EncodingUsed: ")
    arr = []
    for j in range(1,29):
        if (encRow[j] != "") :
           # out.write(encHead[j]+", ")
            arr.append(encHead[j])
    out.write(toString(arr))
    out.write("\n")

    out.write("Tasks: ")
    arr = []
    for j in range(2,14):
        if (taskRow[j] != "") :
            arr.append(taskHead[j])
    out.write(toString(arr))
    out.write("\n")


    out.write("---\n")


    i+=1
