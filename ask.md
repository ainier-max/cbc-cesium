
# 提问记录

## 2026-01-15 12:05:00 — core/libs 方法备注补充

- 提问时间：2026-01-15
- 提问问题：`src/FFCesium/core/libs` 目录下的类（不含 LogicClass）需要按 AddTypeClass 的方式补充方法备注信息字段。
- 修改文件：
	- src/FFCesium/core/libs/MapAccess/DataServerClass.js
	- src/FFCesium/core/libs/MapAccess/MapServerClass.js
	- src/FFCesium/core/libs/MapEffect/PolylineEffectClass.js
	- src/FFCesium/core/libs/MapGather/ElementEditClass.js
	- src/FFCesium/core/libs/MapGather/ElementGatherClass.js
	- src/FFCesium/core/libs/MapGather/MilitaryPlottingEditClass.js
	- src/FFCesium/core/libs/MapGather/MilitaryPlottingGatherClass.js
	- src/FFCesium/core/libs/MapOperate/ElementClass.js
	- src/FFCesium/core/libs/MapOperate/EntityClass.js
	- src/FFCesium/core/libs/MapOperate/MapActionClass.js
	- src/FFCesium/core/libs/MapOperate/MapToolClass.js
	- src/FFCesium/core/libs/MapOperate/PrimitiveClass.js
	- src/FFCesium/core/libs/MapUtil/MapUtilClass.js
	- src/FFCesium/core/libs/MapUtil/TransformClass.js
- 修改简介：为各类公开方法补充对应的 Info 备注字段。
- 修改内容：已在相关类中补充方法备注字段。

## 2026-01-15 11:31:12 — FlyRoamNew: addPolylineEntity 重构适配

- 提问时间：2026-01-15
- 提问问题：因为进行了重构，`FFCesiumExample/senior/FlyRoamNew/FlyRoamNew.vue` 中的 `ffCesium.addPolylineEntity` 需改为重构后的调用方法。
- 修改文件：
	- public/FFCesiumExample/senior/FlyRoamNew/FlyRoamNew.vue
- 修改简介：已将 `ffCesium.addPolylineEntity` 替换为 `ffCesium.entityClass.addPolylineEntity`（重构适配）。
- 修改内容：已在对应示例文件中完成替换。

## 2026-01-15 11:30:12 — FlyRoamNew: setView 重构适配

- 提问时间：2026-01-15
- 提问问题：因为进行了重构，`FFCesiumExample/senior/FlyRoamNew/FlyRoamNew.vue` 中的 `ffCesium.setView` 需改为重构后的调用方法。
- 修改文件：
	- public/FFCesiumExample/senior/FlyRoamNew/FlyRoamNew.vue
- 修改简介：已将 `ffCesium.setView` 替换为 `ffCesium.mapActionClass.setView`（重构适配）。
- 修改内容：已在对应示例文件中完成替换。
- 备注：后续仓库内问题将记录到此文件。





