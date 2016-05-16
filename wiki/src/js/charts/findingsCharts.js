function parseData(rows, tabletop) {

    // get only the rows that have a number corresponding to their entry
    //var rows = _.reject(tabletop.sheets("Encodings").all(), function(o) { return !o.No; });

    rows = _.map(rows, function(d){
        var out =_.reduce(d, function(result, value, key) {

            result[key] = +value || value;
            return result;
        }, { });
        return out;
    });
    var structures = _.reduce(rows, function(result, value, key) {

        if(value.Primary){
            if(value.Functionality){
                result.Primary.Functionality += 1;
            }
            if(value.Mutagenesis){
                result.Primary.Mutagenesis += 1;
            }
            if(value.Structure){
                result.Primary.Structure += 1;
            }
            if(value.Interaction){
                result.Primary.Interaction += 1;
            }
        }

        if(value.Secondary){
            if(value.Functionality){
                result.Secondary.Functionality += 1;
            }
            if(value.Mutagenesis){
                result.Secondary.Mutagenesis += 1;
            }
            if(value.Structure){
                result.Secondary.Structure += 1;
            }
            if(value.Interaction){
                result.Secondary.Interaction += 1;
            }
        }
        if(value.Tertiary){
            if(value.Functionality){
                result.Tertiary.Functionality += 1;
            }
            if(value.Mutagenesis){
                result.Tertiary.Mutagenesis += 1;
            }
            if(value.Structure){
                result.Tertiary.Structure += 1;
            }
            if(value.Interaction){
                result.Tertiary.Interaction += 1;
            }
        }
        if(value.Quaternary){
            if(value.Functionality){
                result.Quaternary.Functionality += 1;
            }
            if(value.Mutagenesis){
                result.Quaternary.Mutagenesis += 1;
            }
            if(value.Structure){
                result.Quaternary.Structure += 1;
            }
            if(value.Interaction){
                result.Quaternary.Interaction += 1;
            }
        }

        return result;

    }, { Primary: {Functionality: 0, Mutagenesis: 0, Structure: 0, Interaction: 0},
        Secondary: {Functionality: 0, Mutagenesis: 0, Structure: 0, Interaction: 0},
        Tertiary: {Functionality: 0, Mutagenesis: 0, Structure: 0, Interaction: 0},
        Quaternary: {Functionality: 0, Mutagenesis: 0, Structure: 0, Interaction: 0}
    });

    // unneeded keys
    var keys = _.keys(_.omit(rows[0], ['Primary', 'Secondary', 'Tertiary', 'Quaternary', 'No', 'Author']));

    // template for the encodings chart
    var out = _.reduce(_.omit(keys, ['Functionality', 'Structure', 'Mutagenesis', 'Interaction']),
        function(result, value, key){

            result[value] = 0;
            return result;

    }, {});
    // map the encodings to each task
    var encodings = _.reduce(rows, function(result, value, key) {

        if(value.Functionality){
            _.keys(out).forEach(function(k, v){

                if(value[k]){
                    result.Functionality[k] += 1;
                }
            })
        }

        if(value.Mutagenesis){
            _.keys(out).forEach(function(k, v){

                if(value[k]){
                    result.Mutagenesis[k] += 1;
                }
            })
        }

        if(value.Structure ){
            _.keys(out).forEach(function(k, v){

                if(value[k]){
                    result.Structure[k] += 1;
                }
            })
        }

        if(value.Interaction ){
            _.keys(out).forEach(function(k, v){

                if(value[k]){
                    result.Interaction[k] += 1;
                }
            })
        }

        return result;

    }, { Functionality:  _.cloneDeep(out),
        Mutagenesis: _.cloneDeep(out),
        Structure: _.cloneDeep(out),
        Interaction: _.cloneDeep(out)
    });

    var maxValue = 0;
    structures = _.map(structures, function(d, k, o)
    {
        var localMax = _.max(_.values(d));
        maxValue = Math.max(maxValue, Math.log(localMax) );

        var obj = {};
        obj.groups = [];
        obj.Structure = k;

        var pairs = _.toPairs(d);
        pairs.forEach(function(arr){
            obj.groups.push({name: arr[0], value: Math.log(arr[1] + 1)});
        });

        return obj;
    });
    chartGraph(structures, "#structure", maxValue,["Functionality", "Mutagenesis", "Structure", "Interaction"]);
    //
    // maxValue = 0;
    // encodings = _.map(encodings, function(d, k, o)
    // {
    //     // console.log(d);
    //     var localMax = _.max(_.values(d));
    //     maxValue = Math.max(maxValue, Math.log(localMax) );
    //
    //     var obj = {};
    //     obj.groups = [];
    //     obj.Structure = k;
    //
    //     var pairs = _.toPairs(_.omit(d, ['Functionality', 'Structure', 'Mutagenesis', 'Interaction']));
    //     pairs.forEach(function(arr){
    //         if(arr[0] !== "Color")
    //             obj.groups.push({name: arr[0], value: Math.log(parseInt(arr[1]) + 1)});
    //     });
    //
    //     return obj;
    // });
    //
    // chartGraph(encodings, "#encoding", maxValue, _.slice(keys,5));

}

function wrap(text, width) {
    text.each(function() {
        var text = d3.select(this),
            words = text.text().split(/\s+/).reverse(),
            word,
            line = [],
            lineNumber = 0,
            lineHeight = 1.1, // ems
            y = text.attr("y"),
            dy = parseFloat(text.attr("dy")),
            tspan = text.text(null).append("tspan").attr("x", 0).attr("y", y).attr("dy", dy + "em");

        console.log(words);

        while (word = words.pop()) {

            line.push(word);
            tspan.text(line.join(" "));

            if (tspan.node().getComputedTextLength() > width) {
                line.pop();
                tspan.text(line.join(" "));
                line = [word];
                tspan = text.append("tspan").attr("x", 0).attr("y", y).attr("dy", ++lineNumber * lineHeight + dy + "em").text(word);
            }
        }
    });
}

function chartGraph(data, chartDiv, maxValue, grpNames)
{
    var totWidth = d3.select(chartDiv).node().parentNode.clientWidth,
        totHeight = totWidth * 0.85,
        margin = {top: 100, right: 20, bottom: 250, left: 150},
        width = totWidth - (margin.left + margin.right),
        height = totHeight - (margin.top + margin.bottom);

    var x = d3.scale.ordinal()
        .rangeRoundBands([0, width]);

    var y = d3.scale.ordinal()
        .rangeRoundBands([height, 0]);

    var xAxis = d3.svg.axis()
        .scale(x)
        .orient("bottom");

    var yAxis = d3.svg.axis()
        .scale(y)
        .orient("left");

    var chart = d3.select(chartDiv)
        .attr("width", totWidth)
        .attr("height", totHeight)
        .append("g")
        .attr("transform","translate("+margin.left+",0)")
        ;

    x.domain(grpNames);
    y.domain(data.map(function(d) { return d.Structure; }));

    chart.append("text")
        .attr("x", (width / 4))
        .attr("y", (height + margin.bottom+ 20))
        .attr("text-anchor", "start")
        .style("font-size", "30px")
        .style("font-weight", "bold")
        //                .style("text-decoration", "underline")
        .text(
            function(d)
            {
                if(this.farthestViewportElement.id == 'structure')
                   return "Structure vs Task Analysis";
                else
                    return 'Task Analysis vs Visual Encoding'
            });


    chart.append("g")
        .attr("class","x axis")
        .attr("transform",
        function() {
            console.log(this.farthestViewportElement.id);
            if(this.farthestViewportElement.id == 'encoding')
                return "translate(0," + (height - margin.bottom/7) + ")";
            else
                return "translate(0," + (height) + ")";
        })
        .call(xAxis)
        .selectAll("text")
        .style("text-anchor","end")
        .attr("transform","rotate(-45)")
        // .attr("dx","1.0em")
        .attr("dy",x.rangeBand()/10+20)
    ;

    chart.append("g")
        .attr("class","y axis")
        // .attr("transform","translate(" + margin.left +  ",0)")
        .call(yAxis)
        .selectAll("text")
        .attr("dx","10px");

    var grows = chart.selectAll(".grow")
        .data(data)
        .enter().append("g")
        .attr("class","grow")
        .attr("transform", function(d) { return "translate(25," + y(d.Structure) + ")"; })
        ;

    var gcells = grows.selectAll(".gcell")
        .data(function(d) { return d.groups; })
        .enter() .append("g")
        .attr("transform", function(d,i,j) {return "translate(" + (i*x.rangeBand()) + ",0)" ; } )
        .attr("class","gcell")
        ;

    rmax = Math.min(y.rangeBand()/2-4,x.rangeBand()/1.5);

    gcells.append("circle")
        .attr("cy",y.rangeBand()/2)
        .attr("cx",x.rangeBand()/2)
        .attr("r",
            function(d) {
                var rind = d.value;
                var rad = rmax / ((-1)*(rind - (maxValue + 1) ));

                return rad;//(rad > 0) ? rad : 0;
            })
        .style("fill",
            function(d) {
                var gbval = 1+Math.floor(255 - (255/4*(d.value)));
                return "rgb(" + 255 + "," + gbval + "," + gbval + ")";
            })
        .style("")
    ;

    // chart.append("text")
    //     .attr("text-anchor", "middle")  // this makes it easy to centre the text as the transform is applied to the anchor
    //     .attr("transform", "translate("+ (width/2) +","+(height+(margin.bottom - 100))+")")  // centre below axis
    //     .style("font-weight", "bold")
    //     .text("Comparative Task");

    // chart.append("text")
    //     .attr("text-anchor", "middle")  // this makes it easy to centre the text as the transform is applied to the anchor
    //     .attr("transform", "translate("+ 0 +","+(height/2)+")rotate(-90)")  // text is drawn off the screen top left, move down and out and rotate
    //     .text("Value");

    d3.selectAll('.container').style("visibility", "visible");
}
