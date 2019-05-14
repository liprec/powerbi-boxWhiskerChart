# Power BI Box and Whisker Chart

[![Build Status](https://dev.azure.com/datascenarios/GitHub%20Projects/_apis/build/status/powerbi-boxWhiskerChart?branchName=master)](https://dev.azure.com/datascenarios/GitHub%20Projects/_build/latest?definitionId=22&branchName=master)

![](assets/BoxWhiskerChart.png)

# Overview
A Box and Whisker chart is a is a convenient way of graphically depicting groups of numerical data through their quartiles.

It shows basic statistical information (five-number summary) of a dataset:
- the 1st and 3rd quartile (box)
- the median (line)
- the mean (dot)
- minimum and maximum value or all values, 1.5x interquartile range [IQR] or a custom percentile value

Outliers (if available) can shown.

See also [Box and Whisker chart at Microsoft Office store](https://store.office.com/en-us/app.aspx?assetid=WA104380831)

# Build
Some changes are needed before this visual can be build:

Changes to `.api/v1.13.0/schema.capablities.json`:

Replace row 95:
```
},
"cartesianKind": {
    "type": "number",
    "description" : "The cartesion kind for analytical support"
}
```
Replace (now) row 1019:
```
},
"fontFamily": {
    "type": "boolean",
    "description": "Displays a selector to allow the user to font family"
}
```

Replace (now) row 1041:
```
},
{
    "required": [
        "fontFamily"
    ]
}
```