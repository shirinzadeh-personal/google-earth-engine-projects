// --------------------------------------------------------------------
// Study Area Definition
// --------------------------------------------------------------------

var coords = [
    [47.835428647832416, 30.61766826793244],
    [49.543802671269916, 30.61766826793244],
    [49.543802671269916, 31.983465419586974],
    [47.835428647832416, 31.983465419586974],
    [47.835428647832416, 30.61766826793244]
];

var studyArea = ee.Geometry.Polygon(coords);

Map.centerObject(studyArea);

// --------------------------------------------------------------------
// Analysis Parameters
// --------------------------------------------------------------------

var start_date = "2001-01-01";
var end_date = "2024-01-01";

// --------------------------------------------------------------------
// MODIS Image Collection
// --------------------------------------------------------------------

var modisCollection = ee.ImageCollection("MODIS/061/MCD12Q1")
    .filterBounds(studyArea)
    .filterDate(start_date, end_date)
    .select("LC_Type1");


print("modisCollection:");
print(modisCollection);

// --------------------------------------------------------------------
// Cropland Area Calculation
// --------------------------------------------------------------------

function calculateCroplandArea(img) {
    var cropland = img.eq(12).or(img.eq(14)).selfMask();

    return cropland
        .multiply(ee.Image.pixelArea())
        .divide(1e6)
        .copyProperties(img, ["system:time_start"]);
}


var cropland = modisCollection.map(calculateCroplandArea);

print("cropland:");
print(cropland);

// --------------------------------------------------------------------
// Cropland Area Time Series
// --------------------------------------------------------------------

var croplandAreaChart = ui.Chart.image.series({
    imageCollection: cropland,
    region: studyArea,
    reducer: ee.Reducer.sum(),
    scale: 500,
    xProperty: "system:time_start"
});

print("croplandAreaChart:");
print(croplandAreaChart);