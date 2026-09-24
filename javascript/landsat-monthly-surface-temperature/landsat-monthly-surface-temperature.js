// --------------------------------------------------------------------
// Study Area Definition
// --------------------------------------------------------------------

var coords = [
    [49.54874788166681, 37.24909132085903],
    [49.63251863361994, 37.24909132085903],
    [49.63251863361994, 37.311648483022054],
    [49.54874788166681, 37.311648483022054],
    [49.54874788166681, 37.24909132085903]
];

var studyArea = ee.Geometry.Polygon(coords);

Map.centerObject(studyArea);

// --------------------------------------------------------------------
// Analysis Parameters
// --------------------------------------------------------------------

var start_date = "2025-01-01";
var end_date = "2026-01-01";

var cloud_cover = 50;

// --------------------------------------------------------------------
// Landsat 8 Image Collection
// --------------------------------------------------------------------

var landsat8Collection = ee.ImageCollection("LANDSAT/LC08/C02/T1_L2")
    .filterBounds(studyArea)
    .filterDate(start_date, end_date)
    .filter(ee.Filter.lt("CLOUD_COVER", cloud_cover));

print("landsat8Collection:");
print(landsat8Collection);

// --------------------------------------------------------------------
// Landsat 9 Image Collection
// --------------------------------------------------------------------

var landsat9Collection = ee.ImageCollection("LANDSAT/LC09/C02/T1_L2")
    .filterBounds(studyArea)
    .filterDate(start_date, end_date)
    .filter(ee.Filter.lt("CLOUD_COVER", cloud_cover));

print("landsat9Collection:");
print(landsat9Collection);

// --------------------------------------------------------------------
// Landsat 8 and 9 Image Collection (Merge)
// --------------------------------------------------------------------

var landsatCollection = landsat8Collection
    .merge(landsat9Collection)
    .sort("system:time_start");

print("landsatCollection:");
print(landsatCollection);

// --------------------------------------------------------------------
// Temporal Collection (Monthly)
// --------------------------------------------------------------------

function createMonthlyComposites(collection, start, end) {
    var startDate = ee.Date(start);
    var endDate = ee.Date(end);
    var months = endDate.difference(startDate, "month").round();

    return ee.ImageCollection.fromImages(
        ee.List.sequence(0, months.subtract(1)).map(function (month) {
            var monthStart = startDate.advance(ee.Number(month), "month");
            var monthEnd = startDate.advance(ee.Number(month).add(1), "month");

            return collection
                .filterDate(monthStart, monthEnd)
                .median()
                .set("system:time_start", monthStart.millis());
        })
    );
}

// --------------------------------------------------------------------
// Monthly Landsat Composite
// --------------------------------------------------------------------

var landsatMonthly = createMonthlyComposites(
    landsatCollection,
    start_date,
    end_date
);

print("landsatMonthly:");
print(landsatMonthly);

// --------------------------------------------------------------------
// Surface Temperature Calculation
// --------------------------------------------------------------------

function calculateSurfaceTemperature(img) {
    var temperatureKelvin = img
        .select("ST_B10")
        .multiply(0.00341802)
        .add(149.0);

    var temperatureCelsius = temperatureKelvin
        .subtract(273.15)
        .rename("Surface_Temperature");

    return temperatureCelsius
        .copyProperties(img, ["system:time_start", "system:time_end"]);
}


var surfaceTemperature = landsatMonthly.map(calculateSurfaceTemperature);

print("surfaceTemperature:");
print(surfaceTemperature);

// --------------------------------------------------------------------
// Temperature Time Series
// --------------------------------------------------------------------

var temperatureChart = ui.Chart.image.series({
    imageCollection: surfaceTemperature,
    region: studyArea,
    reducer: ee.Reducer.mean(),
    scale: 30,
    xProperty: "system:time_start"
});

print("temperatureChart:");
print(temperatureChart);

// --------------------------------------------------------------------
// Temperature Map Visualization
// --------------------------------------------------------------------

var temperatureVis = {
    min: 0,
    max: 50,
    palette: [
        "blue",
        "cyan",
        "yellow",
        "orange",
        "red"
    ]
};


var monthNames = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December"
];


for (var month = 1; month <= 12; month++) {
    Map.addLayer(
        surfaceTemperature
            .filter(ee.Filter.calendarRange(month, month, "month"))
            .first()
            .clip(studyArea),
        temperatureVis,
        "Temperature " + monthNames[month - 1],
        false
    );
}