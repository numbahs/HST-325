const mapfile = "./nyc_zipcodes.json";
const width = 960;
const div = "#map";
const height = window.innerHeight;

let data, map, circles, zoomer, timeline;

const missing = {
  latLon: d => [d.pickup_latitude, d.pickup_longitude].map(parseFloat),
  type: "data",
  mimetype: "text/plain"
};

const addData = (d, a) => {
  for (let k in a) {
    d[k] = a[k];
  }
  return d;
};

const initMap = () =>
  new d3SVGMap({
    div,
    width,
    mapfile,
    height,
    projection_name: "mercator",
    projection_rotate: [73.94, -40.7, 0],
    projection_scale: 90000,
    projection_translate: [480, height / 2],
    onload: () => {
      map.tooltip = d3
        .select("#texts")
        .append("div")
        .attr("id", "tooltip")
        .text("");
    }
  });

const dataParse = (v, d, fn) => {
  v = fn ? fn(v) : v;
  const t = v / d;
  return t < 1 ? 1 : t;
};

const initCircles = () =>
  new dataCircles({
    map,
    data,
    data_class: "circledata",
    mouseover_caption: d =>
      `<b><big>${d.tbl} Pickup</big></b>
        <br>Time: ${d.pickup_time}
				<br>Latitude: ${d.pickup_latitude}
				<br>Longitude: ${d.pickup_longitude}`
  });

const initTimeline = () =>
  new Timeline({
    map,
    data,
    startDate: [0, 0, 1],
    stopDate: [0, 0, 30],
    dateTick: [0, 0, 1],
    //dateInfo: //important function! tells the script how to interpret the date. should take in whatever date field, return an array of [year,month,day]. If month/day don't matter, have them return 0,0
    //the above is blocked out because for this mode, we will not be using a date field, but a date column

    animatorAttachId: "options", //id of whatever element the play/pause/reset button should be attached to (if any)

    onDateTick: currentDate => {
      //simple example that would change the text of an element with the id of "date_status":
      //note that currentDate[0] means get the YEAR only
      if (currentDate[0] == 1942) {
        choropleth.color_field = function(d) {
          return d["pre-1943"];
        };
        choropleth.color_scale = color_linear_total;
        document.getElementById("date_status").innerHTML = "pre-1943 total";
      } else if (currentDate[0] == 1964) {
        choropleth.color_field = function(d) {
          return d["total"];
        };
        choropleth.color_scale = color_linear_total;
        document.getElementById("date_status").innerHTML = "1907-1963 total";
      } else {
        choropleth.color_field = function(d) {
          return d[String(currentDate[0])];
        };
        choropleth.color_scale = color_linear_yearly;
        document.getElementById("date_status").innerHTML = currentDate[0];
      }
      choropleth.showData(); //refresh
    },

    //svgElement: "#circles circle", //the svg element to toggle visibility classes on or off as it animates (optional! if you don't have one, though, you'd better have something happen in the onDateTick function or else it won't do anything interesting)

    sliderAttachId: "slider", //the id of the html element to attach a slider to, if you want one

    loop: false
  });

const initZoomer = () =>
  new mouseZoomer({
    map,
    zoom_if_clicked: ["circle", "path"],
    zoom_to_centroid: false,
    zoom_transition_speed: 700
  });

const init = async () => {
  window.debug = true;
  window.debug_verbose = false;
  map = initMap();
  const req = await fetch("http://localhost:3000/query?tbl=uber&day=1");
  data = await req.json();
  data = addData(data, missing);
  circles = initCircles();
  // timeline = initTimeline();
  zoomer = initZoomer();
  d3VizObj.load();
};

window.onload = init;
