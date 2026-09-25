# MODIS Annual Cropland Area

## Project Overview

This project uses Google Earth Engine to estimate annual cropland area from the MODIS MCD12Q1 Version 6.1 land cover product.

The workflow extracts selected cropland-related classes from the annual `LC_Type1` land cover classification, calculates their area in square kilometers, and generates an annual time series for the study area.

## Objectives

* Extract cropland-related land cover classes
* Calculate annual cropland area
* Analyze changes in cropland area over time
* Generate an annual cropland area time series

## Data

### MODIS MCD12Q1

```text
MODIS/061/MCD12Q1
```

MCD12Q1 Version 6.1 provides global land cover information at yearly intervals with a spatial resolution of 500 meters.

The project uses:

```text
LC_Type1
```

which represents the annual IGBP land cover classification.

### Selected Classes

```text
12 → Croplands
14 → Cropland/Natural Vegetation Mosaics
```

Class 14 represents mosaics of small-scale cultivation with natural vegetation and is therefore included as a cropland-related class in this analysis. [Google Earth Engine Data Catalog](https://developers.google.com/earth-engine/datasets/catalog/MODIS_061_MCD12Q1)

## Analysis Parameters

```text
Start Date: 2001-01-01
End Date: 2024-01-01
Temporal Resolution: Yearly
Spatial Resolution: 500 m
Area Unit: km²
```

The current date range selects the annual observations from 2001 through 2023.

## Workflow

```text
Study Area
    ↓
Analysis Parameters
    ↓
MODIS MCD12Q1 Collection
    ↓
Select LC_Type1
    ↓
Extract Classes 12 and 14
    ↓
Create Cropland Mask
    ↓
Calculate Pixel Area
    ↓
Convert to km²
    ↓
Annual Cropland Area
    ↓
Time Series Chart
```

## Processing Steps

### 1. Study Area Definition

A rectangular study area is defined using geographic coordinates and stored as `studyArea`.

### 2. MODIS Image Collection

The MCD12Q1 collection is filtered by:

* Study area
* Analysis date range

Only the `LC_Type1` band is retained for the analysis.

### 3. Cropland Extraction

Pixels belonging to classes 12 and 14 are selected from `LC_Type1`.

A binary cropland mask is then created and non-cropland pixels are masked.

### 4. Area Calculation

The cropland mask is multiplied by `ee.Image.pixelArea()` to obtain the area of each selected pixel.

The result is divided by `1e6` to convert square meters to square kilometers.

```text
Cropland Mask
    ↓
Pixel Area
    ↓
m²
    ↓
km²
```

The `pixelArea()` function provides the area of each pixel in square meters. [Google Earth Engine API Documentation](https://developers.google.com/earth-engine/apidocs/ee-image-pixelarea)

### 5. Annual Time Series

For each annual cropland-area image, the pixel values within the study area are summed using `ee.Reducer.sum()`.

The result represents the total selected cropland-related area in square kilometers for each year.

The `system:time_start` property is preserved from the original MODIS images and is used as the time axis of the chart. [Google Earth Engine API Documentation](https://developers.google.com/earth-engine/apidocs/ui-chart-image-series)

## Outputs

### Cropland Area Collection

```text
cropland
```

An annual `ImageCollection` containing cropland-related area values in km².

### Cropland Area Time Series

```text
croplandAreaChart
```

A chart showing annual changes in cropland-related area within the study area.

## Project Structure

```text
modis-annual-cropland-area/
├── README.md
└── modis-annual-cropland-area.js
```

## Limitations

The analysis is based on the `LC_Type1` IGBP classification from MCD12Q1.

Class 14 is a mixed class containing both cultivated and natural vegetation. Therefore, the calculated area represents the combined area of classes 12 and 14 rather than cropland-only class 12.

The spatial resolution of the source dataset is 500 meters, so the resulting area estimates are constrained by the MODIS land cover classification and spatial resolution.

The current workflow does not use the MCD12Q1 quality-control band to exclude low-quality or unclassified pixels.

## References

* Google Earth Engine Data Catalog — MCD12Q1.061 MODIS Land Cover Type Yearly Global 500m
  https://developers.google.com/earth-engine/datasets/catalog/MODIS_061_MCD12Q1

* Google Earth Engine API Documentation — `ee.Image.pixelArea()`
  https://developers.google.com/earth-engine/apidocs/ee-image-pixelarea

* Google Earth Engine API Documentation — `ui.Chart.image.series()`
  https://developers.google.com/earth-engine/apidocs/ui-chart-image-series
