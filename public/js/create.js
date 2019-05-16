// Created By Robert Herley
// Edited By Albert Tang
// Inspiration from: https://2019.vizsociety.net/d3viz/digitalnyc/basic.html

class NYCViz {
  constructor() {
    this.state = {
      data: null,
      currentDay: "01",
      heuristics: null,
      dataType: "uber" // Uber or Taxi
    };
    this.svg = null;
    this.g = null;
    this.projection = null;
    this.centered = null;
    this.tooltip = d3.select("#tooltip");
    this.buttons = document.getElementById("buttons").children;
    this.buttons[0].addEventListener("click", () => this.handleClick(0));
    this.buttons[1].addEventListener("click", () => this.handleClick(1));
  }

  handleClick(num) {
    if (this.buttons[num].className !== "active") {
      this.buttons[num].className = "active";
      this.buttons[1 - num].className = "";
      this.updateState({ dataType: num ? "taxi" : "uber" });
    }
  }

  handleCircleClass(d) {
    const [h, m, _] = d.pickup_time.split(":").map(e => parseInt(e));
    const time = h * 100 + m;
    if (time > 530 && time <= 1200) return "morning";
    if (time > 1200 && time <= 1600) return "midday";
    if (time > 1600 && time <= 2030) return "evening";
    return "night";
  }

  handleZoom(d, i, el) {
    const { x, y, width, height } = el[i].getBBox();
    const centroid = [x + width / 2, y + height / 2]; // for non-circular elems
    if (this.centered === d) {
      // zoom out
      this.g
        .transition()
        .duration(600)
        .attr("transform", `scale(1) translate(0,0)`);
    } else {
      // zoom in
      const sF = el[i].nodeName === "circle" ? 5 : 3;
      this.g
        .transition()
        .duration(600)
        .attr(
          "transform",
          `translate(${960 / 2},${550 /
            2}) scale(${sF}) translate(${-centroid[0]}, ${-centroid[1]})`
        );
      this.centered = d;
    }
  }

  handleTooltip(d) {
    this.tooltip
      .style("left", d3.event.pageX + "px")
      .style("top", d3.event.pageY + 20 + "px")
      .style("display", "block").html(`
          <h3>
            ${this.handleCircleClass(d)} ${this.state.dataType} pickup
          </h3>
          <h4>
            ${dayjs(`${d.pickup_date}`).format("MMMM DD, YYYY")} 
            at ${d.pickup_time}
          </h4>
          Latitude: ${d.pickup_latitude}<br>
          Longitude: ${d.pickup_longitude}<br>
        `);
  }

  renderInnerControls() {
    const con = document.getElementById("inner_controls");
    const prettyTime = dayjs(`2014-04-${this.state.currentDay}`).format(
      "MMMM DD, YYYY"
    );
    con.innerHTML = `
        <h2>${this.state.data.length.toLocaleString()} 
        ${this.state.dataType} pickups on ${prettyTime}</h2>
        <div class="legend">
          <div class="circle morning">${this.state.heuristics.morning.toLocaleString()} Morning Pickups</div>
          <div class="circle midday">${this.state.heuristics.midday.toLocaleString()} Midday Pickups</div>
          <div class="circle evening">${this.state.heuristics.evening.toLocaleString()} Evening Pickups</div>
          <div class="circle night">${this.state.heuristics.night.toLocaleString()} Night Pickups</div>
        </div>
        <div id="flatpickr">Change Day</div>`;
    flatpickr("#flatpickr", {
      minDate: "2014-04-01",
      maxDate: "2014-04-30",
      defaultDate: `2014-04-${this.state.currentDay}`,
      onChange: async (_, date) => {
        return this.updateState({
          currentDay: date.split("-")[2]
        });
      }
    });
  }

  drawData() {
    this.g.selectAll("circle").remove();
    this.g
      .selectAll("circle")
      .data(this.state.data)
      .enter()
      .append("circle")
      .attr(
        "cx",
        ({ pickup_longitude: lo, pickup_latitude: la }) =>
          this.projection([lo, la])[0]
      )
      .attr(
        "cy",
        ({ pickup_longitude: lo, pickup_latitude: la }) =>
          this.projection([lo, la])[1]
      )
      .attr("r", "1px")
      .attr("class", d => this.handleCircleClass(d))
      .on("mousemove", this.handleTooltip.bind(this))
      .on("mouseout", () => {
        this.tooltip.style("display", "none");
      })
      .on("mousedown", this.handleZoom.bind(this));
  }

  async updateState(newState) {
    newState.currentDay = newState.currentDay || this.state.currentDay;
    newState.dataType = newState.dataType || this.state.dataType;
    const data = await this.fetchData(
      `/query?tbl=${newState.dataType}&day=${newState.currentDay}`
    );
    this.state = Object.assign({}, this.state, newState, { data });
    this.drawData();
    this.state.heuristics = {
      morning: document.getElementsByClassName("morning").length,
      midday: document.getElementsByClassName("midday").length,
      evening: document.getElementsByClassName("evening").length,
      night: document.getElementsByClassName("night").length
    };
    this.renderInnerControls();
  }

  async fetchData(route) {
    try {
      const response = await fetch(route);
      const json = await response.json();
      return json;
    } catch (err) {
      console.error("Unable to Fetch Data:", err);
    }
  }

  async init() {
    const nyc = await d3.json("./nyc_zipcodes.json");

    this.svg = d3
      .select("#map_container")
      .append("svg")
      .attr("viewBox", "0 0 960 550")
      .attr("preserveAspectRatio", "xMidYMid");

    this.g = this.svg.append("g").attr("id", "svg_map");

    this.projection = d3
      .geoMercator()
      .center([-73.94, 40.7])
      .scale(49000);

    const path = d3.geoPath().projection(this.projection);

    this.g
      .selectAll("path")
      .data(nyc.features)
      .enter()
      .append("path")
      .attr("class", "zip")
      .attr("d", path)
      .on("mousedown", this.handleZoom.bind(this));

    await this.updateState({ dataType: "uber" });
  }
}

const viz = new NYCViz();
window.onload = viz.init.bind(viz);
