# MODIS NDWI Water Body Mapping

## Project Overview

This project uses Google Earth Engine to identify potential water bodies and estimate their area using the Normalized Difference Water Index (NDWI) derived from MODIS surface reflectance data.

The workflow processes MODIS MOD09A1 imagery, calculates NDWI, generates a temporal median composite, extracts potential water pixels using a configurable threshold, calculates their area, and visualizes NDWI changes over time.

## Objectives

- Calculate NDWI from MODIS surface reflectance imagery
- Generate a multi-year NDWI median composite
- Extract potential water bodies using an NDWI threshold
- Estimate the area of threshold-selected water pixels
- Visualize NDWI spatial distribution
- Analyze temporal changes in mean NDWI

## Data Source

### MODIS MOD09A1 Version 6.1

```text
MODIS/061/MOD09A1
```

The MOD09A1 product provides atmospherically corrected surface reflectance observations at 500-meter spatial resolution and an 8-day temporal cadence.

The project uses the following bands:

| Band           | Description                             |
| -------------- | --------------------------------------- |
| `sur_refl_b04` | Green surface reflectance               |
| `sur_refl_b02` | Near-Infrared (NIR) surface reflectance |

The surface reflectance scale factor is `0.0001`.

## Analysis Parameters

```text
Start Date: 2001-01-01
End Date: 2024-01-01
Temporal Resolution: 8 days
Spatial Resolution: 500 m
NDWI Threshold: 0.1
Area Unit: km²
```

The end date is exclusive. Therefore, the analysis period covers observations from January 2001 through December 2023.

## Workflow

```text
Study Area Definition
        ↓
Analysis Parameters
        ↓
MODIS Image Collection
        ↓
Surface Reflectance Scaling
        ↓
NDWI Calculation
        ↓
Temporal Median Composite
        ↓
NDWI Visualization
        ↓
Water Mask Extraction
        ↓
Water Area Calculation
        ↓
Final Water Area Output
        ↓
NDWI Time Series
```

## Processing Steps

### 1. Study Area Definition

A rectangular study area is defined using geographic coordinates and stored as `studyArea`.

The map is centered on this geometry.

### 2. MODIS Image Collection

The MOD09A1 image collection is filtered by:

- Study area
- Analysis date range

### 3. Surface Reflectance Scaling

The Green and NIR bands are selected and multiplied by `0.0001` to convert the stored values to surface reflectance.

### 4. NDWI Calculation

NDWI is calculated using the Green and Near-Infrared bands.

```text
NDWI = (Green - NIR) / (Green + NIR)
```

The resulting band is named `NDWI`.

Pixels with a zero denominator are masked to avoid division by zero.

### 5. Temporal Median Composite

A pixel-wise median composite is generated from the available NDWI images over the entire analysis period.

The resulting image is clipped to the study area and stored as `modisNDWIMedian`.

This composite represents the median NDWI for the full period, rather than NDWI for an individual year.

### 6. NDWI Visualization

The median NDWI image is visualized over a range of `-1` to `1` using a sequential color palette.

### 7. Water Mask Extraction

Potential water pixels are identified using the following threshold:

```text
NDWI > 0.1
```

The resulting binary image is masked to retain only pixels that exceed the selected threshold.

### 8. Water Area Calculation

The area of each selected water pixel is calculated using `ee.Image.pixelArea()`.

Pixel areas are converted from square meters to square kilometers.

```text
Water Mask
    ↓
Pixel Area (m²)
    ↓
Convert to km²
    ↓
Water Area per Pixel
```

### 9. Total Water Area

The areas of all valid water pixels within the study area are summed using `ee.Reducer.sum()` and `reduceRegion()`.

The resulting value is stored as `waterAreaKm2` and reported in square kilometers.

The estimate represents the area of pixels whose median NDWI over the full analysis period exceeds the threshold. It is not an annual water area estimate.

### 10. NDWI Time Series

A time series chart is generated using `ui.Chart.image.series()`.

For each available MODIS NDWI image, the mean NDWI within the study area is calculated using `ee.Reducer.mean()`.

The chart uses `system:time_start` as its temporal axis.

## Outputs

### Median NDWI Image

```text
modisNDWIMedian
```

A multi-year median NDWI image clipped to the study area.

### Water Mask

```text
waterMask
```

A masked image containing pixels with NDWI values greater than the configured threshold.

### Water Area Image

```text
waterAreaImage
```

An image containing the estimated water area per selected pixel in km².

### Total Water Area

```text
waterAreaKm2
```

The sum of the selected pixel areas within the study area.

### NDWI Time Series

```text
ndwiChart
```

A chart showing the mean NDWI of the study area over time.

## Limitations

The water mask depends on the selected NDWI threshold. A threshold of `0.1` is a configurable criterion and does not guarantee that every selected pixel represents water.

The median composite summarizes the entire analysis period. Consequently, the calculated area should not be interpreted as water area for a specific year or as the sum of water area across all observations.

The workflow does not apply an additional explicit pixel-level quality mask using the MOD09A1 quality bands. Results may therefore be affected by residual cloud, atmospheric, or other surface-reflectance uncertainties.

The estimated area is constrained by the spatial resolution of the MODIS product and the chosen threshold.

## Project Structure

```text
modis-ndwi-water-body-mapping/
├── README.md
└── modis-ndwi-water-body-mapping.js
```

## References

- Google Earth Engine Data Catalog — MODIS MOD09A1 Version 6.1  
  https://developers.google.com/earth-engine/datasets/catalog/MODIS_061_MOD09A1

- Google Earth Engine API Documentation — `ee.Image.pixelArea()`  
  https://developers.google.com/earth-engine/apidocs/ee-image-pixelarea

- Google Earth Engine API Documentation — `ui.Chart.image.series()`  
  https://developers.google.com/earth-engine/apidocs/ui-chart-image-series