# Sentinel-1 Flood Detection

## Overview

This project uses Google Earth Engine (GEE) and Sentinel-1 Synthetic Aperture Radar (SAR) imagery to identify potential flood-affected areas by analyzing changes in VV backscatter.

The script compares Sentinel-1 images from February and March 2019 and extracts pixels where the backscatter difference exceeds a specified threshold.

## Data Source

- **Satellite:** Sentinel-1
- **Image Collection:** `COPERNICUS/S1_GRD`
- **Polarization:** VV
- **Instrument Mode:** IW
- **Study Period:** January 1, 2019, to January 1, 2020
- **Before Period:** February 2019
- **After Period:** March 2019

## Workflow

1. Define the study area using a polygon.
2. Filter Sentinel-1 imagery by location, date, polarization, and instrument mode.
3. Reduce speckle noise using a spatial mean filter.
4. Generate median VV composites for February and March 2019.
5. Calculate the difference between the before-flood and after-flood composites.
6. Extract candidate flood-affected pixels using a backscatter difference threshold.
7. Calculate the estimated area of the extracted pixels in square kilometers.

## Analysis Parameters

| Parameter          | Value        | Description                                |
| ------------------ | ------------ | ------------------------------------------ |
| `start_date`       | `2019-01-01` | Start date                                 |
| `end_date`         | `2020-01-01` | End date (exclusive)                       |
| `beforeFloodMonth` | `2`          | February                                   |
| `afterFloodMonth`  | `3`          | March                                      |
| `speckleRadius`    | `30`         | Speckle filter radius in meters            |
| `floodThreshold`   | `7`          | Backscatter difference threshold in dB     |
| `scale`            | `100`        | Scale used for regional analysis in meters |

## Outputs

- Before-flood VV composite
- After-flood VV composite
- VV backscatter change image
- Flood threshold mask
- Flood candidate mask
- Estimated candidate area in square kilometers
- Histogram of backscatter changes
- Image collection sizes for both periods

## Flood Area Calculation

The script uses `ee.Image.pixelArea()` to calculate pixel areas and converts square meters to square kilometers.

The areas of pixels retained by the flood mask are summed using `reduceRegion()`.

## Limitations

- A backscatter difference greater than the selected threshold does not independently confirm flooding.
- Changes in soil moisture, vegetation, surface conditions, and acquisition geometry may influence the results.
- The analysis compares monthly median composites rather than images acquired at the exact time of a flood event.
- The extracted areas should be validated using independent flood information before being interpreted as actual flood extent.

## Requirements

- A Google Earth Engine account
- Access to the Earth Engine Code Editor

## Usage

1. Open the script in the Google Earth Engine Code Editor.
2. Run the script.
3. Inspect the image layers and histogram.
4. Review the estimated area in the Console.