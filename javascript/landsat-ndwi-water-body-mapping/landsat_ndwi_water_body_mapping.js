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

var studyArea = ee.Geometry.Polygon(coords);

Map.centerObject(studyArea);

// --------------------------------------------------------------------
// Analysis Parameters
// --------------------------------------------------------------------

var start_date = "2021-01-01";
var end_date = "2026-01-01";

var cloud_cover = 5;

var ndwiThreshold = 0.1;

// --------------------------------------------------------------------
// Landsat 8 Image Collection
// --------------------------------------------------------------------

var landsat8Collection = ee.ImageCollection("LANDSAT/LC08/C02/T1_L2")
    .filterBounds(studyArea)
    .filterDate(start_date, end_date)
    .filter(ee.Filter.calendarRange(6, 9, "month"))
    .filter(ee.Filter.lt("CLOUD_COVER", cloud_cover));

print("landsat8Collection:");
print(landsat8Collection);

// --------------------------------------------------------------------
// Surface Reflectance Scaling
// --------------------------------------------------------------------

function applySurfaceReflectanceScaling(img) {
    return img
        .select(["SR_B3", "SR_B5"])
        .multiply(2.75e-05)
        .add(-0.2)
        .copyProperties(img, img.propertyNames());
}

// --------------------------------------------------------------------

var landsat8SurfaceReflectance = landsat8Collection.map(applySurfaceReflectanceScaling);

print("landsat8SurfaceReflectance:");
print(landsat8SurfaceReflectance);

// --------------------------------------------------------------------
// NDWI Calculation
// --------------------------------------------------------------------

function calculateNDWI(img) {
    return img
        .normalizedDifference(["SR_B3", "SR_B5"])
        .rename("NDWI")
        .float()
        .copyProperties(img, img.propertyNames());
}

// --------------------------------------------------------------------

var landsat8NDWICollection = landsat8SurfaceReflectance.map(calculateNDWI);

print("landsat8NDWICollection:");
print(landsat8NDWICollection);

// --------------------------------------------------------------------
// NDWI Temporal Composite
// --------------------------------------------------------------------

var landsat8NDWIMedian = landsat8NDWICollection
    .median()
    .clip(studyArea);

print("landsat8NDWIMedian:");
print(landsat8NDWIMedian);

// --------------------------------------------------------------------

Map.addLayer(landsat8NDWIMedian, [], "Landsat 8 NDWI Median", false);
Map.addLayer(landsat8NDWIMedian.gt(0), [], "Landsat 8 NDWI > 0", false);

// --------------------------------------------------------------------
// Water Mask Extraction
// --------------------------------------------------------------------

var ndwiThresholdMask = landsat8NDWIMedian.gt(ndwiThreshold);
var waterMask = ndwiThresholdMask.updateMask(ndwiThresholdMask);

// --------------------------------------------------------------------

Map.addLayer(waterMask, [], "Water Mask", false);

// --------------------------------------------------------------------
// Water Area Calculation
// --------------------------------------------------------------------

var waterAreaImage = waterMask.multiply(ee.Image.pixelArea().divide(1e6));

// --------------------------------------------------------------------

Map.addLayer(waterAreaImage, [], "Water Area (km2)", false);

// --------------------------------------------------------------------
// Final Water Area Output
// --------------------------------------------------------------------

var waterAreaKm2 = waterAreaImage.reduceRegion({
    reducer: ee.Reducer.sum(),
    geometry: studyArea,
    scale: 100
}).values().get(0);

print("waterAreaKm2:");
print(ee.Number(waterAreaKm2));