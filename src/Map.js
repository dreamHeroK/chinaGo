import AMapLoader from "@amap/amap-jsapi-loader";
import { useEffect } from "react";
import "./Map.css";
import { keys, secretKeys } from "./geoKeys";

export default function Map() {
  let map,
    district,
    polygons = [],
    citycode;
  let citySelect = document.getElementById("city");
  let districtSelect = document.getElementById("district");
  let areaSelect = document.getElementById("street");
  useEffect(() => {
    window._AMapSecurityConfig = {
      securityJsCode: secretKeys,
    };
    AMapLoader.load({
      key: keys, // 申请好的Web端开发者Key，首次调用 load 时必填
      version: "2.0", // 指定要加载的 JSAPI 的版本，缺省时默认为 1.4.15
      plugins: ["AMapLoader.Scale", "AMap.DistrictSearch"], //需要使用的的插件列表，如比例尺'AMapLoader.Scale'，支持添加多个如：['...','...']
    })
      .then((AMap) => {
        map = new AMap.Map("container", {
          // 设置地图容器id
          viewMode: "3D", // 是否为3D地图模式
          zoom: 5, // 初始化地图级别
        });
        const opts = {
          subdistrict: 1, //返回下一级行政区
          showbiz: false, //最后一级返回街道信息
        };
        const district = new AMap.DistrictSearch(opts); //注意：需要使用插件同步下发功能才能这样直接使用
        district.search("中国", function (status, result) {
          if (status == "complete") {
            getData(result.districtList[0]);
          }
        });

        function getData(data, level) {
          var bounds = data.boundaries;
          if (bounds) {
            for (var i = 0, l = bounds.length; i < l; i++) {
              var polygon = new AMap.Polygon({
                map: map,
                strokeWeight: 1,
                strokeColor: "#0091ea",
                fillColor: "#80d8ff",
                fillOpacity: 0.2,
                path: bounds[i],
              });
              polygons.push(polygon);
            }
            map.setFitView(); //地图自适应
          }

          //清空下一级别的下拉列表
          if (level === "province") {
            citySelect.innerHTML = "";
            districtSelect.innerHTML = "";
            areaSelect.innerHTML = "";
          } else if (level === "city") {
            districtSelect.innerHTML = "";
            areaSelect.innerHTML = "";
          } else if (level === "district") {
            areaSelect.innerHTML = "";
          }

          var subList = data.districtList;
          if (subList) {
            var contentSub = new Option("--请选择--");
            var curlevel = subList[0].level;
            var curList = document.querySelector("#" + curlevel);
            curList.add(contentSub);
            for (var i = 0, l = subList.length; i < l; i++) {
              var name = subList[i].name;
              var levelSub = subList[i].level;
              var cityCode = subList[i].citycode;
              contentSub = new Option(name);
              contentSub.setAttribute("value", levelSub);
              contentSub.center = subList[i].center;
              contentSub.adcode = subList[i].adcode;
              curList.add(contentSub);
            }
          }
          function search(obj) {
            //清除地图上所有覆盖物
            for (var i = 0, l = polygons.length; i < l; i++) {
              polygons[i].setMap(null);
            }
            var option = obj[obj.options.selectedIndex];
            var keyword = option.text; //关键字
            var adcode = option.adcode;
            district.setLevel(option.value); //行政区级别
            district.setExtensions("all");
            //行政区查询
            //按照adcode进行查询可以保证数据返回的唯一性
            district.search(adcode, function (status, result) {
              if (status === "complete") {
                getData(result.districtList[0], obj.id);
              }
            });
          }
          function setCenter(obj) {
            map.setCenter(obj[obj.options.selectedIndex].center);
          }
        }
      })
      .catch((e) => {
        console.log(e);
      });

    return () => {
      map?.destroy();
    };
  }, []);

  return (
    <div id="container" className="container" style={{ height: "800px" }}></div>
  );
}
