# MMM-HourlyWeatherRange
This module is an extension for the weather module for MagicMirror to display a specific hourly forecast range.  This module is a modification of the default hourly weather module that will start at a given time.

## Installation

To install the module, use your terminal to:

1. Navigate to your MagicMirror's modules folder. If you are using the default installation directory, use the command:<br />`cd ~/MagicMirror/modules`
2. Clone the module:<br />`git clone https://github.com/tdadah/MMM-HourlyWeatherRange.git`
3. Install dependencies:<br /> run `npm install` from the MMM-HourlyWeatherRange directory.

## Using the module

### MagicMirror² Configuration

To use this module, add the following configuration block to the modules array in the `config/config.js` file, don't forget to replace the "MyGoogleCalendarIDHere" with your actual calendar ID:

```
{
  module: "MMM-HourlyWeatherRange",
  position: "top_right",
  header: "Hourly Forecast",
  config: {
    weatherProvider: "weathergov",
    apiBase: "https://api.weather.gov/gridpoints/OKX/28,70/",
    weatherEndoint: "forecast/hourly",
    lat: <LAT>,
    lon: <LON>
  }
},
```

### Configuration Options

Most configurations for the global Weather module that are specific to the hourly forecast will work for this module.
