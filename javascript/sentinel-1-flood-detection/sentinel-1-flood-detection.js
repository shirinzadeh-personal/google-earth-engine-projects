// --------------------------------------------------------------------
// Study Area Definition
// --------------------------------------------------------------------

var coords = [
    [53.924653716055076, 36.43754892304776],
    [55.286958403555076, 36.43754892304776],
    [55.286958403555076, 37.4647452039181],
    [53.924653716055076, 37.4647452039181],
    [53.924653716055076, 36.43754892304776]
];

var studyArea = ee.Geometry.Polygon([coords]);

Map.centerObject(studyArea);
Map.addLayer(studyArea, { color: "red" }, "Study Area", false);

// --------------------------------------------------------------------
// Analysis Parameters
// --------------------------------------------------------------------

var start_date = "2019-01-01";
var end_date = "2020-01-01";

var beforeFloodMonth = 2;
var afterFloodMonth = 3;

var speckleRadius = 30;

var floodThreshold = 7;

var scale = 100;

// --------------------------------------------------------------------
// Speckle Filtering
// --------------------------------------------------------------------

function despeckle(img) {
    var vvLinear = ee.Image.constant(10)
        .pow(img.divide(10));

    var vvFiltered = vvLinear.focalMean(
        speckleRadius,
        "square",
        "meters"
    );

    var vvFilteredDb = vvFiltered
        .log10()
        .multiply(10)
        .rename("VV");

    return vvFilteredDb
        .copyProperties(img, img.propertyNames());
}

// --------------------------------------------------------------------
// Before Flood Image
// --------------------------------------------------------------------

var beforeFloodCollection = ee.ImageCollection("COPERNICUS/S1_GRD")
    .filterBounds(studyArea)
    .filterDate(start_date, end_date)
    .filter(
        ee.Filter.calendarRange(
            beforeFloodMonth,
            beforeFloodMonth,
            "month"
        )
    )
    .filter(
        ee.Filter.listContains(
            "transmitterReceiverPolarisation",
            "VV"
        )
    )
    .filter(ee.Filter.eq("instrumentMode", "IW"))
    .select("VV")
    .map(despeckle);

print("beforeFloodCollection:");
print(beforeFloodCollection);

print("beforeFloodCollection size:");
print(beforeFloodCollection.size());

// --------------------------------------------------------------------

var beforeFlood = beforeFloodCollection
    .median()
    .clip(studyArea);

print("beforeFlood:");
print(beforeFlood);

Map.addLayer(
    beforeFlood,
    { min: -25, max: 0 },
    "Before Flood",
    false
);

// --------------------------------------------------------------------
// After Flood Image
// --------------------------------------------------------------------

var afterFloodCollection = ee.ImageCollection("COPERNICUS/S1_GRD")
    .filterBounds(studyArea)
    .filterDate(start_date, end_date)
    .filter(
        ee.Filter.calendarRange(
            afterFloodMonth,
            afterFloodMonth,
            "month"
        )
    )
    .filter(
        ee.Filter.listContains(
            "transmitterReceiverPolarisation",
            "VV"
        )
    )
    .filter(ee.Filter.eq("instrumentMode", "IW"))
    .select("VV")
    .map(despeckle);

print("afterFloodCollection:");
print(afterFloodCollection);

print("afterFloodCollection size:");
print(afterFloodCollection.size());

// --------------------------------------------------------------------

var afterFlood = afterFloodCollection
    .median()
    .clip(studyArea);

print("afterFlood:");
print(afterFlood);

Map.addLayer(
    afterFlood,
    { min: -25, max: 0 },
    "After Flood",
    false
);

// --------------------------------------------------------------------
// Change Detection
// --------------------------------------------------------------------

var change = beforeFlood
    .subtract(afterFlood)
    .rename("VV_Change");

print("change:");
print(change);

Map.addLayer(
    change,
    {
        min: -7,
        max: 7,
        palette: ["blue", "white", "red"]
    },
    "VV Change",
    false
);

// --------------------------------------------------------------------
// Change Histogram
// --------------------------------------------------------------------

var changeHistogram = ui.Chart.image.histogram(
    change,
    studyArea,
    scale,
    100
).setOptions({
    title: "Distribution of VV Change",
    hAxis: {
        title: "VV Change (dB)"
    },
    vAxis: {
        title: "Pixel Count"
    },
    legend: {
        position: "none"
    }
});

print("changeHistogram:");
print(changeHistogram);

// --------------------------------------------------------------------
// Flood Thresholding
// --------------------------------------------------------------------

var floodThresholdMask = change.gt(floodThreshold);

Map.addLayer(
    floodThresholdMask.clip(studyArea),
    { palette: ["yellow"] },
    "Flood Threshold Mask",
    false
);

// --------------------------------------------------------------------
// Flood Mask
// --------------------------------------------------------------------

var floodMask = floodThresholdMask.updateMask(
    floodThresholdMask
);

Map.addLayer(
    floodMask,
    { palette: ["blue"] },
    "Flood Mask",
    false
);

// --------------------------------------------------------------------
// Flood Area Calculation
// --------------------------------------------------------------------

var floodAreaImage = floodMask
    .multiply(ee.Image.pixelArea())
    .divide(1e6)
    .rename("area_km2");

Map.addLayer(
    floodAreaImage,
    {},
    "Flood Area (km2)",
    false
);

// --------------------------------------------------------------------
// Final Flood Area Output
// --------------------------------------------------------------------

var floodAreaStats = floodAreaImage.reduceRegion({
    reducer: ee.Reducer.sum(),
    geometry: studyArea,
    scale: scale,
    maxPixels: 1e10
});

var floodAreaKm2 = ee.Number(
    ee.Algorithms.If(
        floodAreaStats.get("area_km2"),
        floodAreaStats.get("area_km2"),
        0
    )
);

print("Flood Area (km2):");
print(floodAreaKm2);