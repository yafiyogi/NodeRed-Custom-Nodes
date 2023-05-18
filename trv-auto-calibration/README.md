# trv-auto-calibration
## To install run:
`npm install yafiyogi-trv-auto-calibration.x.y.z.tgz`

## To uninstall
`npm uninstall @yafiyogi/trv-auto-calibration`

## To install in dockerized Node-Red:
```
sudo cp package/yafiyogi-trv-auto-calibration-x.y.z.tgz data/
sudo chown 100999 data/yafiyogi-trv-auto-calibration-x.y.z.tgz
sudo chgrp 100999 data/yafiyogi-trv-auto-calibration-x.y.z.tgz
docker exec -it <container id> /bin/sh -c 'cd /data ; npm install yafiyogi-trv-auto-calibration-x.y.z.tgz'
docker stop nodered
docker start nodered
```
Note: 10999 is the user id and group id on my docker instance of nodered. It may be different for you.

## To uninstall in dockerized Node-Red:
```
docker exec -it <container id> /bin/sh -c 'cd /data ; npm uninstall @yafiyogi/trv-auto-calibration'
docker stop nodered
docker start nodered
```

Instructions to create an auto colibration flow can be fond here: https://yafiyogi.wordpress.com/2023/04/08/configuring-trv-auto-calibration/

## Notes
* It has only been tested with MQTT messages originating from Zigbee2MQTT
* It has only been tested on Moes BRT-100-TRV
* This node expects the payload of the MQTT topics to be a JSON string.
