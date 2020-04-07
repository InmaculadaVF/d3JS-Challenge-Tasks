import * as d3 from "d3";
import * as topojson from "topojson-client";
const germanyjson = require("./Germany.json");
const d3Composite = require("d3-composite-projections");
import { latLongCommunities } from "./communities";
import {  InitialInfected_stats, FinalInfected_stats, DataEntry} from "./stats";


var color = d3
  .scaleThreshold<number, string>()
  .domain([1, 10, 20, 50, 100, 200, 500, 1000, 2000, 3000, 6000, 90000])
  .range([
    "#d3dbeb",
    "#c2cfea",
    "#b1c3ea",
    "#9fb8e9",
    "#8eace8",
    "#83a2e1",
    "#7797da",
    "#6c8dd3",
    "#6581c4",
    "#5e76b6",
    "#566aa7",
    "#4f5f99"
    
  ]);

const svg = d3
  .select("body")
  .append("svg")
  .attr("width", 1024)
  .attr("height", 800)
  .attr("style", "background-color: #f4f4f4");

const aProjection = d3
  .geoMercator()
  .scale(2500)
  .translate([-50, 3000]);

const geoPath = d3.geoPath().projection(aProjection);
const geojson = topojson.feature(germanyjson, germanyjson.objects.layer);


const changeMap = (data: DataEntry[]) =>{
  const maxAffected = data.reduce(
        (max, item) => (item.value > max ? item.value : max),
        0
      );
    
    //Create an scale to map affected to radius size.
    const affectedRadiusScale = d3
    .scaleLinear()
    .domain([0, maxAffected])
    .clamp(true)
    .range([5, 50]); // 50 pixel max radius, we could calculate it relative to width and height


    const calculateRadiusBasedOnAffectedCases = (comunidad: string) => {
      const entry = data.find(item => item.name === comunidad);
      return entry ? affectedRadiusScale(entry.value) : 0;
    };

    const assignProvincenColor = (name: string) => {
      const item =data.find(
        item => item.name === name
        );
        return item ? color(item.value): color(0);
      };
      
    svg
      .selectAll("path")
      .data(geojson["features"])
      .enter()
      .append("path")
      .attr("class", "country")
      .attr("fill",d => assignProvincenColor(d["properties"]["NAME_1"]))
      .attr("d", geoPath as any)
      .merge(svg.selectAll("path") as any)
      .transition()
      .duration(500)
      .attr("fill", d=> assignProvincenColor(d["properties"]["NAME_1"]));

    const circles = svg.selectAll("circle")

    circles
      .data(latLongCommunities)
      .enter()
      .append("circle")
      .attr("class", "affected-marker")
      .attr("r", function(d){
        return calculateRadiusBasedOnAffectedCases(d.name)
      })
      .attr("cx", d => aProjection([d.long, d.lat])[0])
      .attr("cy", d => aProjection([d.long, d.lat])[1])
      .merge(circles as any)
      .transition()
      .duration(500)
      .attr("r",function(d){
        return calculateRadiusBasedOnAffectedCases(d.name)
      });

    };

  //Buttons

  document
  .getElementById("Initial")
  .addEventListener("click", function handleCurrentResults(){
    console.log("incial")
    changeMap(InitialInfected_stats);
  });

  document
    .getElementById("Final")
    .addEventListener("click", function handleCurrentResults(){
      console.log("final");
      changeMap(FinalInfected_stats);
    });

  changeMap(InitialInfected_stats)

    