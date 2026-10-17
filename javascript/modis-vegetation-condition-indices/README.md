# MODIS Vegetation Condition Indices

## Project Overview

This project uses Google Earth Engine to calculate and visualize vegetation and temperature condition indices from MODIS satellite data.

The workflow generates monthly Normalized Difference Vegetation Index (NDVI) and Land Surface Temperature (LST) composites, calculates the Vegetation Condition Index (VCI) and Temperature Condition Index (TCI), and combines them to derive the Vegetation Health Index (VHI).

## Objectives

- Process MODIS NDVI and land surface temperature data
- Generate monthly image composites
- Calculate monthly historical NDVI and temperature minimums and maximums
- Calculate VCI and TCI
- Derive VHI from VCI and TCI
- Visualize index time series and monthly maps

## Data Sources

### MODIS NDVI

```text
MODIS/061/MOD13A2
```

Selected band: `NDVI`

Quality filtering is applied using the `SummaryQA` band. Pixels with `SummaryQA = 0` are retained.

### MODIS Land Surface Temperature

```text
MODIS/061/MOD11A2
```

Selected band: `LST_Day_1km`

Quality filtering is applied using the `QC_Day` band. The workflow checks mandatory quality, data quality, and the LST error flag.

## Analysis Parameters

```text
Start Date: 2001-01-01
End Date: 2026-01-01
Temporal Resolution: Monthly
Spatial Resolution: 1 km
NDVI Scale Factor: 0.0001
LST Scale Factor: 0.02
VHI Weight (alpha): 0.5
```

The analysis period covers January 2001 through December 2025 because the end date is exclusive.

## Workflow

```text
Study Area
    ↓
Analysis Parameters
    ↓
MODIS NDVI Collection
MODIS Temperature Collection
    ↓
Quality Filtering
    ↓
Monthly Median Composites
    ↓
Monthly Historical Minimum and Maximum
    ↓
VCI Calculation
TCI Calculation
    ↓
Combine VCI and TCI
    ↓
VHI Calculation
    ↓
Time Series Chart
    ↓
Monthly Map Visualization
```

## Processing Steps

### 1. Study Area Definition

A rectangular study area is defined using geographic coordinates and stored as `studyArea`.

### 2. Image Collection Filtering

The MODIS collections are filtered by study area and analysis date range.

Quality masks are applied to NDVI and land surface temperature observations before monthly compositing.

### 3. Monthly Composite Generation

The analysis period is divided into monthly intervals. For each month, the median of the available observations is calculated.

The first day of each month is stored as `system:time_start` to support temporal analysis and charting.

### 4. Historical Monthly Minimum and Maximum

For each calendar month, the historical minimum and maximum are calculated independently for every pixel across the monthly composites.

NDVI values are scaled by `0.0001`, while LST values are scaled by `0.02`.

### 5. Vegetation Condition Index

VCI measures the relative position of current NDVI between its historical minimum and maximum for the corresponding calendar month.

```text
VCI = 100 × (NDVI - NDVI_min) / (NDVI_max - NDVI_min)
```

Pixels with a zero NDVI range are masked to avoid division by zero.

### 6. Temperature Condition Index

TCI measures the relative position of current LST between its historical maximum and minimum for the corresponding calendar month.

```text
TCI = 100 × (LST_max - LST) / (LST_max - LST_min)
```

Pixels with a zero temperature range are masked to avoid division by zero.

### 7. Vegetation Health Index

VHI combines VCI and TCI using equal weights.

```text
VHI = alpha × VCI + (1 - alpha) × TCI
```

The current configuration uses `alpha = 0.5`.

### 8. Time Series Visualization

A time series chart displays the spatial mean of VCI, TCI, and VHI across the study area.

### 9. Monthly Map Visualization

The project displays separate map layers for VCI, TCI, and VHI for a selected year and month.

The current configuration displays July 2025.

## Outputs

### Monthly Collections

- `ndviMonthly`
- `temperatureMonthly`
- `vciCollection`
- `tciCollection`
- `modisIndices`
- `modisVHI`

### Time Series Chart

`indicesChart` displays the mean monthly VCI, TCI, and VHI values within the study area.

### Monthly Maps

Three map layers are generated for the selected month:

- VCI
- TCI
- VHI

## Limitations

The results depend on the quality of the input MODIS observations and the selected quality-filtering criteria.

Monthly composites are calculated from the available observations. The number of valid observations may vary between months and years.

VCI and TCI are calculated using historical minimum and maximum values for each calendar month. Pixels with zero historical range are excluded from the respective index calculations.

The VHI calculation uses equal weighting for VCI and TCI. Different weighting schemes may produce different results.

## Project Structure

```text
modis-vegetation-condition-indices/
├── README.md
└── modis-vegetation-condition-indices.js
```

## References

- MODIS MOD13A2 Version 6.1
  https://developers.google.com/earth-engine/datasets/catalog/MODIS_061_MOD13A2

- MODIS MOD11A2 Version 6.1
  https://developers.google.com/earth-engine/datasets/catalog/MODIS_061_MOD11A2

- Google Earth Engine API Documentation
  https://developers.google.com/earth-engine/apidocs