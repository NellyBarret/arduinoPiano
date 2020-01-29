function drawAppSizeComparison(apps) {
	let android_data = [];
	let ios_data = [];
	
	const convert_apps_to_data = function(apps) {
		let data = [];
		for (let appName in apps) {
			let versions = apps[appName]["versions"];
			if (versions != null && versions.length > 0) {
				// Sort versions
				versions.sort(function (a, b) {
					return moment(a["date"], "DD-MM-YYYY").unix() - moment(b["date"], "DD-MM-YYYY").unix();
				});
				
				data.push({
					axis: apps[appName]['appName'],
					value: parseFloat(versions[versions.length - 1]["size"]),
				});
			}
		}
		return data;
	};

	function filter_apps(apps){
	    var filtered_apps_android = []
        var filtered_apps_ios = []
	    for(var i in apps){
	        apps[i]['appName'] = i.replace("-ios", "");
	        if(apps[i].os == 'ios')
                filtered_apps_ios.push(apps[i]);
            else
                filtered_apps_android.push(apps[i]);
        }
	    return [filtered_apps_android, filtered_apps_ios]
    }

    var tmp = filter_apps(apps);

    var android_apps = tmp[0];
    var ios_apps = tmp[1];
	
	android_data = convert_apps_to_data(android_apps);
	ios_data = convert_apps_to_data(ios_apps);
	
	// Check if there are app that are present only in android or ios, and delete them
	android_data = android_data.filter(datum => ios_data.map(ios => ios.axis).includes(datum.axis));
	ios_data = ios_data.filter(datum => android_data.map(android => android.axis).includes(datum.axis));

	// Sort data arrays
	// android_data.sort((a, b) => a["value"] - b["value"]);
	// ios_data.sort((a, b) => a["value"] - b["value"]);

	var dataset = []
	for(var k = 0 ; k < 2 ; k++) {
		var serie = []
		for (var i = 0; i < android_data.length; i++) {
			for (var j = 0; j < ios_data.length; j++) {
				if (ios_data[j].axis == android_data[i].axis) {
					if(k == 0){
						serie.push({
							'axis': android_data[i].axis,
							'y0': 0,
							'y1': android_data[i].value,
							'type': 'android'
						})
					}else{
						serie.push({
							'axis': android_data[i].axis,
							'y0': android_data[i].value,
							'y1': ios_data[i].value,
							'type': 'ios'
						})
					}

				}
			}
		}
		dataset.push(serie)
	}

    d3.select("#app-size-comparison-placeholder").selectAll('*').remove();

	let appSizeCompPlaceholder = d3.select("#app-size-comparison-placeholder");
	let svg = d3.select("#app-size-comparison-placeholder")
		.append("svg")
		.attr("width", "100%")
		.attr("height", "600")
		.append("g");

	let jappSizeCompPlaceholder = $("#app-size-comparison-placeholder");
	let width = jappSizeCompPlaceholder.width();
	let height = jappSizeCompPlaceholder.height();
	height = 500;

	const x = d3.scaleBand()
		.range([50, width])
		.padding(0.1);

	const y = d3.scaleLinear()
		.range([height, 0]);


	x.domain(android_data.map(function(d) { return d.axis; }));
	y.domain([0, d3.max(ios_data, function(d) { return d.value; })]);

	var colors = {'ios': "#ff7c43", 'android': "#003f5c"};


	var size = 20
	svg.selectAll(".legend")
		.remove()

	svg.selectAll("mydots")
		.data(['android', 'ios'])
		.enter()
		.append("rect")
		.attr("x", width - 100)
		.attr("y", function(d,i){ return 50 + i*(size+5)}) // 100 is where the first dot appears. 25 is the distance between dots
		.attr("width", size)
		.attr("height", size)
		.attr("class", "legend")
		.style("fill", function(d){ return colors[d]})

// Add one dot in the legend for each name.

	svg.selectAll("mylabels")
		.data(['android', 'ios'])
		.enter()
		.append("text")
		.attr("x", (width-75))
		.attr("y", function(d,i){ return 50 + i*(size+5) + (size/2)}) // 100 is where the first dot appears. 25 is the distance between dots
		.attr("class", "legend")
		.style("fill", function(d){ return colors[d]})
		.text(function(d){ return d})
		.attr("text-anchor", "left")
		.style("alignment-baseline", "middle")

	svg.append("g")
		.attr("transform", "translate(0," + height + ")")
		.call(d3.axisBottom(x).tickSize(0))
		.selectAll("text")
		.style("text-anchor", "end")
		.attr("dx", "-.8em")
		.attr("dy", ".15em")
		.attr("transform", "rotate(-65)");


	svg.append("g")
		.call(d3.axisLeft(y).ticks(6))
		.attr("transform", "translate(50,0)")


	svg.append("g")
		.selectAll("g")
		.data(dataset)
		.join("g")
		.selectAll("rect")
		.data(d => d)
		.join("rect")
		.attr("fill", function(d){
			return colors[d.type];
		})
		.attr("x", function(d) { return x(d.axis); })
		.attr("y", d => y(d.y1))
		.attr("height", d => y(d.y0) - y(d.y1))
		.attr("width", x.bandwidth());

}
