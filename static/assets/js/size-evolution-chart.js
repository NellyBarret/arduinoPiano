let svg, xScale, yScale, xAxis, yAxis, Color;

function drawSizeEvolutionChart(apps, apps_to_draw) {
	let sizeEvolutionChart = d3.select("#size-evolution-chart-placeholder").selectAll('*').remove();
	svg = d3.select("#size-evolution-chart-placeholder")
		.append("svg")
		.attr("width", "100%")
		.attr("height", "800px")
		.append("g");

	svg.selectAll("*").remove();

	let jsizeEvolutionChart = $("#size-evolution-chart-placeholder");
	let width = jsizeEvolutionChart.width();
	let height = jsizeEvolutionChart.height();
	let defaultTransition = "easeQuad";
	let defaultTransitionDuration = 200;
    let leftMargin = 20;
    let bottomMargin = 20;

	svg.append("text")
		.attr("x", (width/2+50 + leftMargin))
		.attr("y",  30)
		.attr("text-anchor", "middle")
		.style("font-size", "16px")
		.style("text-decoration", "underline")
		.text("Applications size evolution over time")
        .style("fill", "white");

    svg.append("text")
		.attr("x", (width/2+50 +leftMargin))
		.attr("y",  height-30-bottomMargin)
		.attr("text-anchor", "middle")
		.text("Version release date")
        .style("fill", "white");

    svg.append("text")
		.attr("x", -(height/2-50-bottomMargin))
		.attr("y",  (leftMargin))
		.attr("text-anchor", "middle")
		.text("Application size (kB)")
        .style("fill", "white")
        .attr("transform", "rotate(-90)");



	// Create scales
	xScale = d3.scaleTime().range([50+leftMargin, width - 50])
		.domain([
			d3.min(Object.values(apps), app => d3.min(app["versions"], a => moment(a["date"], "YYYY-MM-DD").unix()*1000)),
			d3.max(Object.values(apps), app => d3.max(app["versions"], a => moment(a["date"], "YYYY-MM-DD").unix()*1000))
		]);

	//xScale = xScale.ticks(d3.timeMinute, 15);

	yScale = d3.scaleLinear().range([50, height - 100 - bottomMargin]).domain([d3.max(Object.values(apps), app => {if(app["os"] == "android") {return d3.max(app["versions"], a => parseFloat(a["size"]))} else return 0}), 0]);

	Color = d3.scaleOrdinal()
        .range(["#a6cee3","#1f78b4","#b2df8a","#33a02c","#fb9a99","#e31a1c","#fdbf6f","#ff7f00","#cab2d6","#6a3d9a","#ffff99","#b15928","#1b9e77","#d95f02","#7570b3","#e7298a","#66a61e","#e6ab02","#a6761d","#666666"])
      .domain(Object.keys(apps));


	let defs = svg.append("defs");
	
	// Define the div for the tooltip
	var tooltip = d3.select("body").append("div")
		.attr("class", "tooltip")
		.style("opacity", 0);

	yAxis = d3.axisLeft(yScale)

	xAxis = d3.axisBottom(xScale)//.ticks(dates)
		.ticks(d3.timeMonth.every(6))
	 .tickFormat(d => moment(new Date(d)).format("MMMM YYYY"))
        

	svg.append("g")
		.call(yAxis)
		.attr("class", "yaxis")
		.attr("transform", "translate(70, 0)");
	
	svg.append("g")
		.call(xAxis)
		.attr("class", "xaxis")
		.attr("transform", `translate(0, ${height - 100 - bottomMargin})`)
		.selectAll("text")
		.attr("transform", "translate(20, 20) rotate(45)");

	draw_path(apps, apps_to_draw)
}


function draw_path(apps, apps_to_draw){

	// Add one dot in the legend for each name.
	var size = 20
	svg.selectAll(".legend")
		.remove()

	svg.selectAll("mydots")
		.data(apps_to_draw)
		.enter()
		.append("rect")
		.attr("x", 80)
		.attr("y", function(d,i){ return 50 + i*(size+5)}) // 100 is where the first dot appears. 25 is the distance between dots
		.attr("width", size)
		.attr("height", size)
		.attr("class", "legend")
		.style("fill", function(d){ return Color(d)})

// Add one dot in the legend for each name.

	svg.selectAll("mylabels")
		.data(apps_to_draw)
		.enter()
		.append("text")
		.attr("x", 60 + size*1.2+ 20)
		.attr("y", function(d,i){ return 50 + i*(size+5) + (size/2)}) // 100 is where the first dot appears. 25 is the distance between dots
		.attr("class", "legend")
		.style("fill", function(d){ return Color(d)})
		.text(function(d){ return d})
		.attr("text-anchor", "left")
		.style("alignment-baseline", "middle")


	// rescaling :
	apps_to_reshape = []
	for(let appName in apps){
		if(apps_to_draw.indexOf(appName) == -1)
			continue
		apps_to_reshape.push(apps[appName])
	}
	yScale.domain([d3.max(Object.values(apps_to_reshape), app => {if(app["os"] == "android") {return d3.max(app["versions"], a => parseFloat(a["size"]))} else return 0}), 0]);
	svg.select(".yaxis").transition().duration(1500)
		.call(yAxis);


    for(let appName in apps){
        if(apps_to_draw.indexOf(appName) == -1)
            continue

        let appNameSlug = appName.replace(/\s/g,'')
        path = svg.select("." + appNameSlug);
        if(path.empty()){
            continue;
        }
        let versions = apps[appName]["versions"];
		versions.sort(function (a, b) {
			return moment(a["date"], "YYYY-MM-DD").unix() - moment(b["date"], "YYYY-MM-DD").unix();
		});
        path.datum(versions).transition().duration(500)
            .attr("d", d3.line()
                .x(function (d) {
                    return xScale(moment(d["date"], "YYYY-MM-DD").unix()*1000)
                })
                .y(function (d) {
                    return yScale(parseFloat(d["size"]))
                }))
    }


	for (let appName in apps) {
		let appNameSlug = appName.replace(/\s/g,'')
		app = svg.select("." + appNameSlug);
		if(apps_to_draw.indexOf(appName) == -1){
			if(!app.empty()) {
				app.remove();
			}
			continue;
		}
		if(!app.empty()) {
			continue;
		}



		let versions = apps[appName]["versions"];
		// Sort versions
		versions.sort(function (a, b) {
			return moment(a["date"], "YYYY-MM-DD").unix() - moment(b["date"], "YYYY-MM-DD").unix();
		});

		var path = svg.append("path")
			.datum(versions)
			.attr("d", d3.line()
				.x(function (d) {
					return xScale(moment(d["date"], "YYYY-MM-DD").unix()*1000)
				})
				.y(function (d) {
					return yScale(parseFloat(d["size"]))
				}))
			.attr("fill", "none")
			.attr("stroke", Color(appName))
			.attr("stroke-width", 3)
			.attr("class", appNameSlug)
            .attr("name", appName)

		var totalLength = path.node().getTotalLength()*10;

		path.attr("stroke-dasharray", totalLength + " " + totalLength)
			.attr("stroke-dashoffset", totalLength)
			.transition()
			.duration(2000)
			.ease(d3.easeLinear)
			.attr("stroke-dashoffset", 0)
	}
}
