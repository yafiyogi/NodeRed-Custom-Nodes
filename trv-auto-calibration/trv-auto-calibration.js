/*
  Thermostatic Radiator Valve Auto Calibration for Node-Red
  Copyright (C) 2023 Yafiyogi

  This program is free software: you can redistribute it and/or modify
  it under the terms of the GNU General Public License as published by
  the Free Software Foundation, either version 3 of the License, or
  (at your option) any later version.

  This program is distributed in the hope that it will be useful,
  but WITHOUT ANY WARRANTY; without even the implied warranty of
  MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
  GNU General Public License for more details.

  You should have received a copy of the GNU General Public License
  along with this program.  If not, see <https://www.gnu.org/licenses/>.

*/

module.exports = function(RED) {
    function TrvAutoCalibration(config) {
        RED.nodes.createNode(this, config);
        var node = this;

        node.last_update = 0;
        node.trv_min_interval = Math.max(5, Math.round(parseFloat(config.trv_min_interval) || 10));
        node.name = config.name.trim();
        console.log("trv name [%O] interval [%Oms]",
                    node.name,
                    node.trv_min_interval,
                    config.trv_min_interval);

        node.trv_topic = config.trv_topic.trim();
        node.trv_temperature_prop = config.trv_temperature_prop.trim();
        node.trv_calibration_prop = config.trv_calibration_prop.trim();
        console.log("trv topic [%O] temp property [%O] offset property [%O]",
                    node.trv_topic,
                    node.trv_temperature_prop,
                    node.trv_calibration_prop);

        node.sensor_topic = config.sensor_topic.trim();
        node.sensor_temperature_prop = config.sensor_temperature_prop.trim();
        console.log("sensor topic [%O] temp property [%O]",
                    node.sensor_topic,
                    node.sensor_temperature_prop);

        node.temp_sensor = null;
        node.temp_trv = null;
        node.temp_trv_offset = null;
        node.timer = null;

        var is_defined = function(prop) {
            return (null  !== prop)
                && (undefined !== prop);
        };

        var timer_handler = function() {
            var msg = {
                "id": node.id,
                "payload": null,
                "topic": "trv-adjust-timer"
            };
            adjust_fn(msg);
        };

        var adjust_fn = function(msg) {
            var payload = null;

            if(node.sensor_topic === msg.topic) {
                payload = JSON.parse(msg.payload);

                var sensor_temp = payload[node.sensor_temperature_prop];
                if(is_defined(sensor_temp)) {
                    node.temp_sensor = parseFloat(sensor_temp);
                }
            }
            else if(node.trv_topic === msg.topic) {
                payload = JSON.parse(msg.payload);

                var trv_temp = payload[node.trv_temperature_prop];
                if(is_defined(trv_temp)) {
                    node.temp_trv = parseFloat(trv_temp);
                }

                var trv_offset = payload[node.trv_calibration_prop];
                if(is_defined(trv_offset)) {
                    node.temp_trv_offset = parseFloat(trv_offset);
                }
            }
            else if("trv-adjust-timer" === msg.topic) {
                if(is_defined(node.timer)) {
                    clearTimeout(node.timer);
                    node.timer = null;
                }
            }

            if(is_defined(node.temp_sensor)
               && is_defined(node.temp_trv)
               && is_defined(node.temp_trv_offset)) {
                var temp_offset = Math.round(node.temp_sensor - node.temp_trv) + Math.round(node.temp_trv_offset);
                if(temp_offset === -0)
                {
                    // I don't like -0!
                    temp_offset = 0;
                }

                if(temp_offset !== node.temp_trv_offset) {
                    // The offset has changed since last time.
                    var now = Math.round(Date.now() / 1000);
                    var date_diff = now - node.last_update;

                    if( date_diff >= node.trv_min_interval) {
                        // No update has occured within the last trv_min_interval.
                        node.last_update = now;

                        var out_msg = {
                            "payload": {
                            }
                        };
                        out_msg.payload[node.trv_calibration_prop] = temp_offset;

                        var sender = function(msg) {
                            node.send(msg)
                        };

                        // Delay send for 500ms
                        setTimeout(sender, 500, out_msg);
                    }

                    if(!is_defined(node.timer)) {
                        // There are two scenarios where a timed recalibration needs to happen:
                        // 1) A sensor or TRV update happens before trv_min_interval since the last
                        //    update.
                        // 2) A recalibration is missed. This is where a recalibration is sent,
                        //    but for some reason it doesn't actually change the TRV settings.
                        var delay = ((node.last_update - now + node.trv_min_interval) * 1000) + 500;

                        node.timer = setTimeout(timer_handler, delay);
                    }
                }
            }
        };

        node.on("input", adjust_fn);
    }
    RED.nodes.registerType("trv-auto-calibration", TrvAutoCalibration);
};
