// --------------------------------------------------------------------
// Study Area Definition
// --------------------------------------------------------------------

var coords = [
    [44.89751019856392, 37.1128886042545],
    [45.91374555012642, 37.1128886042545],
    [45.91374555012642, 38.32084168030978],
    [44.89751019856392, 38.32084168030978],
    [44.89751019856392, 37.1128886042545]
];

var studyArea = ee.Geometry.Polygon([coords]);

Map.centerObject(studyArea);

// --------------------------------------------------------------------
// Analysis Parameters
// --------------------------------------------------------------------

var start_date = "2001-01-01";
var end_date = "2024-01-01";

var ndwiThreshold = 0.1;

// --------------------------------------------------------------------
// MODIS Image Collection
// --------------------------------------------------------------------

var modisCollection = ee.ImageCollection("MODIS/061/MOD09A1")
    .filterBounds(studyArea)
    .filterDate(start_date, end_date);


print("modisCollection:");
print(modisCollection);

// --------------------------------------------------------------------
// Surface Reflectance Scaling
// --------------------------------------------------------------------

function applySurfaceReflectanceScaling(img) {
    return img
        .select(["sur_refl_b04", "sur_refl_b02"])
        .multiply(0.0001)
        .copyProperties(img, ["system:time_start"]);
}

// --------------------------------------------------------------------

var modisSurfaceReflectance = modisCollection.map(applySurfaceReflectanceScaling);

print("modisSurfaceReflectance:");
print(modisSurfaceReflectance);

// --------------------------------------------------------------------
// NDWI Calculation
// --------------------------------------------------------------------

function calculateNDWI(img) {
    var green = img.select("sur_refl_b04");
    var nir = img.select("sur_refl_b02");

    var denominator = green.add(nir);

    return green
        .subtract(nir)
        .divide(denominator)
        .updateMask(denominator.neq(0))
        .rename("NDWI")
        .float()
        .copyProperties(img, ["system:time_start"]);
}

// --------------------------------------------------------------------

var modisNDWICollection = modisSurfaceReflectance.map(calculateNDWI);

print("modisNDWICollection:");
print(modisNDWICollection);

// --------------------------------------------------------------------
// NDWI Temporal Composite
// --------------------------------------------------------------------

var modisNDWIMedian = modisNDWICollection
    .median()
    .clip(studyArea);

print("modisNDWIMedian:");
print(modisNDWIMedian);

// --------------------------------------------------------------------
// NDWI Visualization
// --------------------------------------------------------------------

var ndwiVis = {
    min: -1,
    max: 1,
    palette: [
        "#a6611a",
        "#dfc27d",
        "#f5f5f5",
        "#80cdc1",
        "#018571"
    ]
};

Map.addLayer(
    modisNDWIMedian,
    ndwiVis,
    "MODIS NDWI Median",
    false
);

// --------------------------------------------------------------------
// Water Mask Extraction
// --------------------------------------------------------------------

var waterMask = modisNDWIMedian
    .gt(ndwiThreshold)
    .selfMask()
    .rename("Water");

print("waterMask:");
print(waterMask);

Map.addLayer(
    waterMask,
    { palette: ["#2166ac"] },
    "Water Mask",
    false
);

// --------------------------------------------------------------------
// Water Area Calculation
// --------------------------------------------------------------------

var waterAreaImage = waterMask
    .multiply(ee.Image.pixelArea())
    .divide(1e6)
    .rename("Water_Area_km2");

print("waterAreaImage:");
print(waterAreaImage);

Map.addLayer(
    waterAreaImage,
    {
        min: 0,
        max: 0.25,
        palette: ["#2166ac"]
    },
    "Water Area (km2)",
    false
);

// --------------------------------------------------------------------
// Final Water Area Output
// --------------------------------------------------------------------

var waterAreaResult = waterAreaImage.reduceRegion({
    reducer: ee.Reducer.sum(),
    geometry: studyArea,
    scale: 500,
    maxPixels: 1e13
});

var waterAreaKm2 = waterAreaResult.get("Water_Area_km2");

print("Water Area (km2):", waterAreaKm2);

// --------------------------------------------------------------------
// NDWI Time Series
// --------------------------------------------------------------------

var ndwiChart = ui.Chart.image.series({
    imageCollection: modisNDWICollection,
    region: studyArea,
    reducer: ee.Reducer.mean(),
    scale: 500,
    xProperty: "system:time_start"
}).setOptions({
    title: "MODIS NDWI Time Series",
    hAxis: {
        title: "Date"
    },
    vAxis: {
        title: "Mean NDWI"
    },
    lineWidth: 1,
    pointSize: 0
});

print("ndwiChart:");
print(ndwiChart);