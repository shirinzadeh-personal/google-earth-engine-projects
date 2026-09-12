# Landsat 8 NDWI Water Body Mapping

A Google Earth Engine project for water body extraction and surface water area estimation using Landsat 8 Surface Reflectance imagery and the Normalized Difference Water Index (NDWI).

## Overview

This project uses Landsat 8 Collection 2 Level-2 Surface Reflectance data to identify water bodies within a defined study area.

The workflow includes:

- Filtering Landsat 8 images by study area and acquisition date
- Applying surface reflectance scaling
- Calculating NDWI
- Creating a temporal median composite
- Extracting water pixels using an NDWI threshold
- Estimating water surface area in square kilometers

## Methodology

The Normalized Difference Water Index (NDWI) is calculated as:

NDWI = (Green - NIR) / (Green + NIR)

For Landsat 8 imagery:

- Green band: `SR_B3`
- Near Infrared band: `SR_B5`

Water extraction is performed using an NDWI threshold:

```text
NDWI > 0.1