// --------------------------------------------------------------------
// Study Area Definition
// --------------------------------------------------------------------

var coords = [
    [44.480112498474966, 36.39582550601722],
    [46.715830271912466, 36.39582550601722],
    [46.715830271912466, 37.63703644334073],
    [44.480112498474966, 37.63703644334073],
    [44.480112498474966, 36.39582550601722]
];

var studyArea = ee.Geometry.Polygon([coords]);

Map.centerObject(studyArea);

// --------------------------------------------------------------------
// Analysis Parameters
// --------------------------------------------------------------------

var start_date = "2001-01-01";
var end_date = "2026-01-01";

// --------------------------------------------------------------------
// MODIS NDVI Image Collection
// --------------------------------------------------------------------

var modisNDVICollection = ee.ImageCollection("MODIS/061/MOD13A2")
    .filterBounds(studyArea)
    .filterDate(start_date, end_date)
    .map(function (image) {
        var goodQuality = image.select("SummaryQA").eq(0);

        return image.select("NDVI")
            .updateMask(goodQuality)
            .copyProperties(image, ["system:time_start"]);
    });

print("modisNDVICollection:");
print(modisNDVICollection);

// --------------------------------------------------------------------
// MODIS Temperature Image Collection
// --------------------------------------------------------------------

var modisTemperatureCollection = ee.ImageCollection("MODIS/061/MOD11A2")
    .filterBounds(studyArea)
    .filterDate(start_date, end_date)
    .map(function (image) {
        var qa = image.select("QC_Day");

        var mandatoryQA = qa.bitwiseAnd(3).eq(0);
        var dataQuality = qa.rightShift(2).bitwiseAnd(3).eq(0);
        var lstError = qa.rightShift(6).bitwiseAnd(3).lte(1);

        var goodQuality = mandatoryQA
            .and(dataQuality)
            .and(lstError);

        return image.select("LST_Day_1km")
            .updateMask(goodQuality)
            .copyProperties(image, ["system:time_start"]);
    });

print("modisTemperatureCollection:");
print(modisTemperatureCollection);

// --------------------------------------------------------------------
// Monthly Composite Generation
// --------------------------------------------------------------------

function createMonthlyComposites(collection, start, end) {
    var startDate = ee.Date(start);
    var endDate = ee.Date(end);

    var monthCount = endDate
        .difference(startDate, "month")
        .round();

    return ee.ImageCollection.fromImages(
        ee.List.sequence(0, monthCount.subtract(1)).map(function (month) {
            var monthStart = startDate.advance(
                ee.Number(month),
                "month"
            );

            var monthEnd = startDate.advance(
                ee.Number(month).add(1),
                "month"
            );

            return collection
                .filterDate(monthStart, monthEnd)
                .median()
                .set("system:time_start", monthStart.millis());
        })
    );
}

// --------------------------------------------------------------------
// Monthly NDVI Composite
// --------------------------------------------------------------------

var ndviMonthly = createMonthlyComposites(
    modisNDVICollection,
    start_date,
    end_date
);

print("ndviMonthly:");
print(ndviMonthly);

// --------------------------------------------------------------------
// Monthly Temperature Composite
// --------------------------------------------------------------------

var temperatureMonthly = createMonthlyComposites(
    modisTemperatureCollection,
    start_date,
    end_date
);

print("temperatureMonthly:");
print(temperatureMonthly);

// --------------------------------------------------------------------

print("NDVI Monthly Count:", ndviMonthly.size());
print("Temperature Monthly Count:", temperatureMonthly.size());

// --------------------------------------------------------------------
// Monthly NDVI Minimum and Maximum
// --------------------------------------------------------------------

var ndviMonthlyMinMax = ee.ImageCollection.fromImages(
    ee.List.sequence(1, 12).map(function (month) {
        var monthlyNDVI = ndviMonthly
            .filter(ee.Filter.calendarRange(month, month, "month"));

        var ndviMin = monthlyNDVI.min()
            .multiply(0.0001)
            .rename("NDVI_min");

        var ndviMax = monthlyNDVI.max()
            .multiply(0.0001)
            .rename("NDVI_max");

        return ndviMin
            .addBands(ndviMax)
            .set("month", month);
    })
);

print("ndviMonthlyMinMax:");
print(ndviMonthlyMinMax);

// --------------------------------------------------------------------
// Monthly Temperature Minimum and Maximum
// --------------------------------------------------------------------

var temperatureMonthlyMinMax = ee.ImageCollection.fromImages(
    ee.List.sequence(1, 12).map(function (month) {
        var monthlyTemperature = temperatureMonthly
            .filter(ee.Filter.calendarRange(month, month, "month"));

        var temperatureMin = monthlyTemperature.min()
            .multiply(0.02)
            .rename("LST_min");

        var temperatureMax = monthlyTemperature.max()
            .multiply(0.02)
            .rename("LST_max");

        return temperatureMin
            .addBands(temperatureMax)
            .set("month", month);
    })
);

print("temperatureMonthlyMinMax:");
print(temperatureMonthlyMinMax);

// --------------------------------------------------------------------
// VCI Calculation
// --------------------------------------------------------------------

var vciCollection = ndviMonthly.map(function (img) {
    var month = ee.Date(img.get("system:time_start")).get("month");

    var limits = ee.Image(
        ndviMonthlyMinMax
            .filter(ee.Filter.eq("month", month))
            .first()
    );

    var ndvi = img.select("NDVI").multiply(0.0001);
    var ndviMin = limits.select("NDVI_min");
    var ndviMax = limits.select("NDVI_max");

    var ndviRange = ndviMax.subtract(ndviMin);

    return ndvi
        .subtract(ndviMin)
        .divide(ndviRange)
        .multiply(100)
        .updateMask(ndviRange.gt(0))
        .rename("VCI")
        .copyProperties(img, ["system:time_start"]);
});

print("vciCollection:");
print(vciCollection);

// --------------------------------------------------------------------
// TCI Calculation
// --------------------------------------------------------------------

var tciCollection = temperatureMonthly.map(function (img) {
    var month = ee.Date(img.get("system:time_start")).get("month");

    var limits = ee.Image(
        temperatureMonthlyMinMax
            .filter(ee.Filter.eq("month", month))
            .first()
    );

    var lst = img.select("LST_Day_1km").multiply(0.02);
    var lstMin = limits.select("LST_min");
    var lstMax = limits.select("LST_max");

    var lstRange = lstMax.subtract(lstMin);

    return lstMax
        .subtract(lst)
        .divide(lstRange)
        .multiply(100)
        .updateMask(lstRange.gt(0))
        .rename("TCI")
        .copyProperties(img, ["system:time_start"]);
});

print("tciCollection:");
print(tciCollection);

// --------------------------------------------------------------------

print("TCI Image Count:", tciCollection.size());
print("First TCI Image:", tciCollection.first());

// --------------------------------------------------------------------
// Combine VCI and TCI
// --------------------------------------------------------------------

var modisIndices = ee.ImageCollection(
    vciCollection.map(function (vciImage) {
        var time = vciImage.get("system:time_start");

        var tciImage = ee.Image(
            tciCollection
                .filter(ee.Filter.eq("system:time_start", time))
                .first()
        );

        return vciImage
            .addBands(tciImage.select("TCI"))
            .set("system:time_start", time);
    })
);

print("modisIndices:");
print(modisIndices);

// --------------------------------------------------------------------

print("VCI Count:", vciCollection.size());
print("TCI Count:", tciCollection.size());
print("Combined Count:", modisIndices.size());
print("Combined Band Names:", ee.Image(modisIndices.first()).bandNames());

// --------------------------------------------------------------------
// VHI Calculation
// --------------------------------------------------------------------

var alpha = 0.5;

var modisVHI = modisIndices.map(function (img) {
    var vci = img.select("VCI");
    var tci = img.select("TCI");

    var vhi = vci.multiply(alpha)
        .add(tci.multiply(1 - alpha))
        .rename("VHI");

    return img
        .addBands(vhi)
        .copyProperties(img, ["system:time_start"]);
});

print("modisVHI:");
print(modisVHI);

// --------------------------------------------------------------------

print("VHI Collection Size:", modisVHI.size());
print("First VHI Image:", modisVHI.first());
print("Band Names:", ee.Image(modisVHI.first()).bandNames());

// --------------------------------------------------------------------
// Vegetation and Temperature Indices Time Series
// --------------------------------------------------------------------

var indicesChart = ui.Chart.image.series({
    imageCollection: modisVHI.select(["VCI", "TCI", "VHI"]),
    region: studyArea,
    reducer: ee.Reducer.mean(),
    scale: 1000,
    xProperty: "system:time_start"
}).setOptions({
    title: "Monthly VCI, TCI, and VHI",
    hAxis: {
        title: "Date"
    },
    vAxis: {
        title: "Index Value",
        viewWindow: {
            min: 0,
            max: 100
        }
    },
    lineWidth: 2,
    pointSize: 0
});

print("indicesChart:");
print(indicesChart);

// --------------------------------------------------------------------
// Map Visualization Parameters
// --------------------------------------------------------------------

var year = 2025;
var month = 7;

var monthStart = ee.Date.fromYMD(year, month, 1);
var monthEnd = monthStart.advance(1, "month");

var monthlyImage = ee.Image(
    modisVHI
        .filterDate(monthStart, monthEnd)
        .first()
);

// --------------------------------------------------------------------
// Monthly VCI, TCI, and VHI Visualization
// --------------------------------------------------------------------

var indexVis = {
    min: 0,
    max: 100,
    palette: [
        "a50026",
        "f46d43",
        "ffffbf",
        "a6d96a",
        "006837"
    ]
};

Map.addLayer(
    monthlyImage.select("VCI").clip(studyArea),
    indexVis,
    "VCI " + year + "-" + month,
    false
);

Map.addLayer(
    monthlyImage.select("TCI").clip(studyArea),
    indexVis,
    "TCI " + year + "-" + month,
    false
);

Map.addLayer(
    monthlyImage.select("VHI").clip(studyArea),
    indexVis,
    "VHI " + year + "-" + month,
    false
);