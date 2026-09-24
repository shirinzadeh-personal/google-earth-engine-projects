# Landsat Monthly Surface Temperature

## Project Overview

This project uses Google Earth Engine to calculate and visualize monthly Land Surface Temperature (LST) from Landsat 8 and Landsat 9 Collection 2 Level 2 data.

The workflow combines Landsat 8 and Landsat 9 observations, creates monthly median composites, converts the `ST_B10` thermal band to Celsius, generates a monthly temperature time series, and displays each month as a separate map layer.

## Objectives

* Calculate monthly Land Surface Temperature
* Combine Landsat 8 and Landsat 9 observations
* Generate monthly median composites
* Analyze monthly temperature variation
* Visualize monthly temperature maps

## Data

### Landsat 8

```text
LANDSAT/LC08/C02/T1_L2
```

### Landsat 9

```text
LANDSAT/LC09/C02/T1_L2
```

Both datasets are USGS Landsat Collection 2 Tier 1 Level 2 products containing surface temperature and quality-assurance information.

## Analysis Parameters

```text
Start Date: 2025-01-01
End Date: 2026-01-01
Cloud Cover: < 50%
Temporal Resolution: Monthly
Composite Method: Median
Temperature Unit: Celsius
Spatial Resolution: 30 m
```

The date range can be changed to analyze other complete monthly periods.

## Workflow

```text
Study Area
    ↓
Analysis Parameters
    ↓
Landsat 8 Collection
    ↓
Landsat 9 Collection
    ↓
Merge and Sort
    ↓
Monthly Median Composites
    ↓
Surface Temperature Calculation
    ↓
Monthly Temperature Time Series
    ↓
Monthly Temperature Map Layers
```

## Processing Steps

### 1. Study Area Definition

A rectangular study area is defined using geographic coordinates and stored as `studyArea`.

### 2. Image Collection Filtering

Landsat 8 and Landsat 9 collections are filtered by:

* Study area
* Analysis date range
* Scene-level cloud cover

The two filtered collections are then merged and sorted by acquisition time.

### 3. Monthly Composite Generation

The analysis period is divided into monthly intervals.

For each month:

1. Images within the monthly interval are selected.
2. A pixel-wise median composite is calculated.
3. The first day of the month is stored as `system:time_start`.

The result is a monthly `ImageCollection`.

### 4. Surface Temperature Calculation

The `ST_B10` band is converted from the stored Landsat Level 2 value to Kelvin and then to Celsius.

```text
ST_B10 × 0.00341802 + 149.0
        ↓
Temperature in Kelvin
        ↓
Temperature in Celsius
```

The resulting band is renamed:

```text
Surface_Temperature
```

### 5. Temperature Time Series

For each monthly composite, the mean temperature of the study area is calculated and displayed as a time series.

```text
Monthly Image
    ↓
Mean Temperature over Study Area
    ↓
Time Series Chart
```

### 6. Monthly Map Visualization

Each monthly temperature composite is displayed as a separate map layer.

The layer names follow the month names:

```text
Temperature January
Temperature February
Temperature March
...
Temperature December
```

All monthly layers are clipped to the study area.

## Visualization

The current temperature visualization uses:

```text
Minimum: 0 °C
Maximum: 50 °C
```

with a sequential color palette from blue to red.

These values are visualization parameters and do not define the actual minimum or maximum temperature in the dataset.

## Outputs

### Monthly Temperature Collection

```text
surfaceTemperature
```

A monthly `ImageCollection` containing surface temperature in Celsius.

### Temperature Time Series

```text
temperatureChart
```

A chart showing the mean monthly surface temperature of the study area.

### Monthly Temperature Maps

Twelve independent map layers are generated for the selected analysis period.

## Project Structure

```text
landsat-monthly-surface-temperature/
├── README.md
└── landsat-monthly-surface-temperature.js
```

## Limitations

The current workflow uses the `CLOUD_COVER` scene-level property as a cloud filtering criterion. It does not currently apply pixel-level cloud and cloud-shadow masking using `QA_PIXEL`.

The monthly composite method is based on the median of available observations. Months with limited valid observations may therefore contain fewer observations than other months.

Some Landsat Level 2 assets may contain empty surface-temperature bands when surface-temperature processing is unavailable.

## References

* Google Earth Engine Data Catalog — Landsat 8 Collection 2 Level 2
* Google Earth Engine Data Catalog — Landsat 9 Collection 2 Level 2
* Google Earth Engine API Documentation — `ee.ImageCollection.median()`
* Google Earth Engine API Documentation — `ee.ImageCollection.filterDate()`
* Google Earth Engine API Documentation — `ee.Date.advance()`
* Google Earth Engine API Documentation — `ui.Chart.image.series()`
* Google Earth Engine API Documentation — `Map.addLayer()`