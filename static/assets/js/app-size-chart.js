$(document).ready(function() {
	let appSizeChartPlaceholder = d3.select("#app-size-chart-placeholder");
	let svg = d3.select("#app-size-chart-placeholder")
		.append("svg")
		.attr("width", "100%")
		.attr("height", "100%")
		.append("g");
	
	let jappSizeChartPlaceholder = $("#app-size-chart-placeholder");

	let width = jappSizeChartPlaceholder.width();
	let height = jappSizeChartPlaceholder.height();
	let leftMargin = 1;
	let rightMargin = 1;
	let topMargin = 1;
	let bottomMargin = 1;
	let defaultTransition = "easeQuad";
	let defaultTransitionDuration = 200;
	
	let defs = svg.append("defs");
	let apps_to_draw = []


    document.getElementById('android').checked = true;
	var os = "android"
    
    $("input:checkbox").on('click', function() {
    // in the handler, 'this' refers to the box clicked on
    var $box = $(this);
    if ($box.is(":checked")) {
        // the name of the box is retrieved using the .attr() method
        // as it is assumed and expected to be immutable
        var group = "input:checkbox[name='" + $box.attr("name") + "']";
        // the checked state of the group/box on the other hand will change
        // and the current value is retrieved using .prop() method
        $(group).prop("checked", false);
        $box.prop("checked", true);
    } else {
        $box.prop("checked", false);
    }
});
	
	// Define the div for the tooltip
	var tooltip = d3.select("body").append("div")
		.attr("class", "tooltip")
		.style("opacity", 0);
	
	d3.json("data.json").then(function (apps) {
        var Color = d3.scaleOrdinal()
        .range(["#a6cee3","#1f78b4","#b2df8a","#33a02c","#fb9a99","#e31a1c","#fdbf6f","#ff7f00","#cab2d6","#6a3d9a","#ffff99","#b15928","#1b9e77","#d95f02","#7570b3","#e7298a","#66a61e","#e6ab02","#a6761d","#666666"])
        .domain(Object.keys(apps));


        var categories = []
        for (let appName in apps) {
            if (!(categories.includes(apps[appName]["categorie"]))) {
                categories.push(apps[appName]["categorie"])
            }
        }

        const getAppId = function(appName) {
        	return appName.replace(/ /g, '-');
        };

        const isAppDisabled = function(appName) {
        	return apps[appName]["os"]!=os;
        };

        const onAppClicked = function(appName, force_select = false, force_deselect = false, commit = true) {
        	if (force_select && force_deselect)
        		throw new EvalError("force_select and force_deselect cannot be true at the same time.");
	        let index = apps_to_draw.indexOf(appName);
	        if(force_select || (index === -1 && !force_deselect)) {
	        	console.log("d3.select('#' + getAppId(appName) + \"-app\"):", d3.select('#' + getAppId(appName) + "-app"));
		        d3.select('#' + getAppId(appName) + "-app")
			        .attr("stroke-width", "0")
			        .transition()
			        .duration(300)
			        .style("stroke", Color(appName))
			        .attr("stroke-width", "5");

		        if (!apps_to_draw.includes(appName))
		            apps_to_draw.push(appName);
	        }
	        else{
		        d3.select('#' + getAppId(appName) + "-app")
			        .transition()
			        .duration(300)
			        .attr("stroke-width", "0");

		        if (index !== -1)
			        apps_to_draw.splice(index, 1);
	        }

	        if (commit)
                draw_path(apps, apps_to_draw)
        };
        const deselectAllApps = function(commit = true) {
	        apps_to_draw = [];
	        if (commit)
                draw_path(apps, apps_to_draw)
        };

        d3.selectAll(".filter_button").on("change", function() {
            // I *think* "inline" is the default.
            
            categorie = this.value
            
            for (let appName in apps)
                onAppClicked(appName, undefined, true, false);
            deselectAllApps();
           if(($(this).is(":checked")))
                for (let appName in apps)
                    if (!isAppDisabled(appName) && apps[appName]["categorie"] == categorie)
                        onAppClicked(appName, true, undefined, false);
                draw_path(apps, apps_to_draw)
            });
        
        
        d3.selectAll(".select_os").on("change", function() {
            os = this.value
            if (os == 'ios'){
                document.getElementById('size-evolution-chart-placeholder').innerHTML = "Impossible d'afficher le graphique : <br>Apple ne fournit pas l'historique des tailles de mise à jour des applications ios.";
                return;
            }
            document.getElementById('size-evolution-chart-placeholder').innerHTML = '';
            defs.selectAll("pattern").remove()
            svg.selectAll("rect").remove()
            createMap(apps)
            apps_to_draw = []
            drawSizeEvolutionChart(apps, apps_to_draw)
        });

        d3.selectAll(".select-all").on('click', function() {
        	for (let appName in apps)
        		if (!isAppDisabled(appName))
			        onAppClicked(appName, true, undefined, false);
            draw_path(apps, apps_to_draw)
        });
		d3.selectAll(".deselect-all").on('click', function() {
			for (let appName in apps)
				onAppClicked(appName, undefined, true, false);
			deselectAllApps();
		});

        function resize() {
            width = jappSizeChartPlaceholder.width();
            height = jappSizeChartPlaceholder.height();
            defs.selectAll("pattern").remove()
            svg.selectAll("rect").remove()
            createMap(apps)
            drawSizeEvolutionChart(apps, apps_to_draw);
            drawAppSizeComparison(apps);
        }

        window.onresize = resize;

		function createMap(apps) {


            let maxSize = Math.sqrt(d3.max(Object.values(apps), function(app){
                if(app["os"]!=os){
                    return 0;
                }else{
                    let versions = app["versions"];
	                versions.sort(function (a, b) {
	                    return moment(a["date"], "YYYY-MM-JJ").unix() - moment(b["date"], "YYYY-MM-JJ").unix();
                    });

	                return parseInt(versions[versions.length - 1]["size"], 10);}}));
            let maxScaled=width/(Math.ceil(Math.sqrt(Object.keys(apps).length/4)))
            let appScale = d3.scaleLinear().range([10, maxScaled])
                .domain([0,maxSize]);


            iter = 0;
			lastX = 0;
			lastY = 5;
            maxYOfLine = 0;
            for (let appName in apps) {
                let appObject = apps[appName];
                if(isAppDisabled(appName))
                    continue;
                let appId = getAppId(appName);
                let versions = appObject.versions;
	            versions.sort(function (a, b) {
	                return moment(a["date"], "YYYY-MM-JJ").unix() - moment(b["date"], "YYYY-MM-JJ").unix();
                });
	            let size = parseInt(versions[versions.length - 1]["size"],10);
	            let appSize = appScale(Math.sqrt(size));
                defs.append("pattern")
                    .attr("id", appId)
                    .attr("width", 1)
                    .attr("height", 1)
                    .attr("patternUnits", "objectBoundingBox")
                    .append("image")
                    .attr("xlink:href", appObject['icon'])
                    .attr("width", appSize - (leftMargin + rightMargin))
                    .attr("height", appSize - (topMargin + bottomMargin));
                if(lastX + appSize > width){
                    lastX = 0;
                    lastY += maxScaled;
                    maxYOfLine = appSize;
                }
                if(appSize > maxYOfLine){
                    maxYOfLine = appSize;
                }


                svg.append("rect")
	                .attr("id", appId + "-app")
                    .attr("width", appSize - (leftMargin + rightMargin))
                    .attr("height", appSize - (topMargin + bottomMargin))
                     .attr("x", lastX + leftMargin + (maxScaled/2-appSize/2))
                     .attr("y", lastY + bottomMargin + + (maxScaled/2-appSize/2))
                    .style("fill", `url(#${appId})`)
                    .on("mouseover", function(_) {
                        tooltip
                            .transition(defaultTransition)
                            .duration(defaultTransitionDuration)
                            .style("opacity", .9);
                        tooltip.html(`${appName}<br/>${appObject["versions"][appObject["versions"].length-1]["date"]}: ${appObject["versions"][appObject["versions"].length-1]["size"]}`)
                            .style("left", d3.event.pageX + "px")
                            .style("top", d3.event.pageY + "px")
                    })
                    .on("mouseout", function(_) {
                        tooltip
                            .transition(defaultTransition)
                            .duration(defaultTransitionDuration)
                            .style("opacity", 0);
                    })
                    .on("click", function(){
                        onAppClicked(appName);
                    });
                lastX += maxScaled;
                iter++;
            }
        }
        drawAppSizeComparison(apps);
        drawSizeEvolutionChart(apps, []);
        createMap(apps);
        onAppClicked("Facebook")
        onAppClicked("Facebook Lite")
        onAppClicked("Instagram")
        onAppClicked("Messenger")
        onAppClicked("Twitter")
	});

});
