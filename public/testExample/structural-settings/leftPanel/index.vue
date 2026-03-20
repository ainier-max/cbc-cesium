<template>
  <div class="sidebar">
    <div class="sidebar-scroll-area">
      <!-- 全局参数折叠面板 -->
      <div class="accordion-item" :class="{ active: activeCollapse === 'global' }">
        <div class="accordion-header" @click="toggleCollapse('global')">
          <h2>全局坝体参数配置</h2>
          <i class="arrow-icon"></i>
        </div>
        <div class="accordion-content">
          <div class="global-params">
            <div class="row">
              <div class="input-group">
                <label>全局库水位 (m)</label>
                <input type="number" v-model.number="globalConfig.reservoir_water_level" step="0.1" @input="onInput" />
              </div>
              <div class="input-group">
                <label>坝顶高程 (m)</label>
                <input type="number" v-model.number="globalConfig.dam_top_elevation" @input="onInput" />
              </div>
            </div>
            <div class="row">
              <div class="input-group">
                <label>坝底高程 (m)</label>
                <input type="number" v-model.number="globalConfig.dam_bottom_elevation" @input="onInput" />
              </div>
              <div class="input-group">
                <label>坝顶宽度 (m)</label>
                <input type="number" v-model.number="globalConfig.dam_top_width" @input="onInput" />
              </div>
            </div>
            <div class="row">
              <div class="input-group">
                <label>上游坡比 (1:m1)</label>
                <input type="number" v-model.number="globalConfig.upstream_slope" step="0.1" @input="onInput" />
              </div>
              <div class="input-group">
                <label>下游坡比 (1:m2)</label>
                <input type="number" v-model.number="globalConfig.downstream_slope" step="0.1" @input="onInput" />
              </div>
            </div>
            <div class="row">
              <div class="input-group">
                <label>台阶垂直间距 (m)</label>
                <input type="number" v-model.number="globalConfig.step_height" step="1" placeholder="0:不启用"
                  @input="onInput" />
              </div>
              <div class="input-group">
                <label>台阶/马道宽度 (m)</label>
                <input type="number" v-model.number="globalConfig.step_width" step="0.5" @input="onInput" />
              </div>
            </div>
            <div class="row">
              <div class="input-group">
                <label>坝体材质类型</label>
                <select v-model="globalConfig.material_type" @change="onInput">
                  <option value="earth">土石坝 (含防渗心墙)</option>
                  <option value="clay">粘土均质坝</option>
                </select>
              </div>
              <div class="input-group">
                <label>坝壳渗透系数 k (m/day)</label>
                <input type="number" v-model.number="globalConfig.permeability_coefficient" step="1e-9"
                  @input="onInput" />
              </div>
            </div>

            <div v-show="globalConfig.material_type === 'earth'" class="core-wall-inputs">
              <h3>防渗心墙物理参数</h3>
              <div class="row">
                <div class="input-group">
                  <label>心墙顶高 (m)</label>
                  <input type="number" v-model.number="globalConfig.core_top_elevation" @input="onInput" />
                </div>
                <div class="input-group">
                  <label>心墙顶宽 (m)</label>
                  <input type="number" v-model.number="globalConfig.core_top_width" @input="onInput" />
                </div>
              </div>
              <div class="row">
                <div class="input-group">
                  <label>心墙底宽 (m)</label>
                  <input type="number" v-model.number="globalConfig.core_bottom_width" @input="onInput" />
                </div>
                <div class="input-group">
                  <label>心墙渗透系数 k (m/day)</label>
                  <input type="number" v-model.number="globalConfig.core_permeability_coefficient" step="1e-9"
                    @input="onInput" />
                </div>
              </div>
            </div>

            <div class="drainage-inputs">
              <h3>下游排水棱体配置</h3>
              <div class="row">
                <div class="input-group">
                  <label>棱体顶高程 (m)</label>
                  <input type="number" v-model.number="globalConfig.prism_top_elevation" @input="onInput" />
                </div>
                <div class="input-group">
                  <label>棱体顶宽度 (m)</label>
                  <input type="number" v-model.number="globalConfig.prism_top_width" @input="onInput" />
                </div>
              </div>
              <div class="row">
                <div class="input-group">
                  <label>反滤/外坡比 (1:m_d)</label>
                  <input type="number" v-model.number="globalConfig.prism_slope" step="0.1" @input="onInput" />
                </div>
                <div class="input-group">
                  <label>内坡比 (1:m_i)</label>
                  <input type="number" v-model.number="globalConfig.prism_inner_slope" step="0.1" placeholder="0:垂直"
                    @input="onInput" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 断面配置折叠面板 -->
      <div class="accordion-item" :class="{ active: activeCollapse === 'section' }">
        <div class="accordion-header" @click="toggleCollapse('section')">
          <h2>断面切换与局部配置</h2>
          <i class="arrow-icon"></i>
        </div>
        <div class="accordion-content">
          <div class="section-params">
            <div class="section-manager">
              <select :value="currentSectionId" @change="onSwitchSection($event.target.value)">
                <option v-for="section in sections" :key="section.id" :value="section.id">
                  {{ section.name }}
                </option>
              </select>
              <button class="btn-primary" @click="emit('addSection')">+ 增加</button>
            </div>
            <div class="input-group">
              <label>当前断面水位 (留空继承全局)</label>
              <input type="number" v-model.number="currentSection.localLevel" placeholder="继承全局"
                @input="emit('syncSectionData')" />
            </div>

            <div class="sensor-params-nested">
              <h3>
                实测测管数据 (当前: <span>{{ currentSection.name }}</span>)
              </h3>
              <table class="sensor-table">
                <thead>
                  <tr>
                    <th width="20%">编号</th>
                    <th width="25%">轴距X</th>
                    <th width="25%">底高</th>
                    <th width="25%">水位</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="(sensor, index) in currentSection.sensors" :key="index">
                    <td><input type="text" v-model="sensor.id" @input="emit('draw')" /></td>
                    <td><input type="number" v-model.number="sensor.x" @input="emit('draw')" /></td>
                    <td><input type="number" v-model.number="sensor.bottom" @input="emit('draw')" /></td>
                    <td><input type="number" v-model.number="sensor.water" @input="emit('draw')" /></td>
                    <td><button class="btn-delete" @click="emit('removeSensor', index)">×</button></td>
                  </tr>
                </tbody>
              </table>
              <button class="btn-add" @click="emit('addSensor')">+ 添加传感器</button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 固定底部按钮区 -->
    <div class="sidebar-footer" style="margin-bottom: 6px;">
      <el-button type="primary" size="small" @click="onSave">保存</el-button>
      <el-button type="primary" size="small" @click.stop="onExport">导出</el-button>
      <el-button type="info" size="small" @click.stop="resetReservoirConfigFun" plain>恢复</el-button>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from "vue";
import { saveReservoirConfig, exportReservoirConfig, resetReservoirConfig } from "@/api/systemSettings/index";
import { ElMessage } from "element-plus";

const props = defineProps({
  globalConfig: Object,
  sections: Array,
  currentSectionId: [Number, String]
});

const emit = defineEmits([
  "update:currentSectionId",
  "syncGlobalAndDraw",
  "switchSection",
  "addSection",
  "syncSectionData",
  "draw",
  "removeSensor",
  "addSensor"
]);

const activeCollapse = ref("global");

const toggleCollapse = (key) => {
  activeCollapse.value = activeCollapse.value === key ? "" : key;
};

const currentSection = computed(() => {
  return props.sections.find((s) => s.id === props.currentSectionId) || props.sections[0];
});

const onSave = async () => {
  try {
    const { globalConfig, sections } = props;

    // Construct sections with nested piezometers
    const mappedSections = sections.map((section) => ({
      section_name: section.name,
      local_reservoir_water_level: section.localLevel,
      piezometers: (section.sensors || []).map((sensor) => ({
        sensor_id: sensor.id,
        water_level: sensor.water,
        x_distance: sensor.x,
        bottom_elevation: sensor.bottom
      }))
    }));

    // Map material type
    const materialMap = {
      earth: "土石坝 (含防渗心墙)",
      clay: "粘土均质坝"
    };

    const cleanDamGeometry = {
      core_bottom_width: globalConfig.core_bottom_width,
      core_top_elevation: globalConfig.core_top_elevation,
      core_top_width: globalConfig.core_top_width,
      core_permeability_coefficient: globalConfig.core_permeability_coefficient,
      dam_bottom_elevation: globalConfig.dam_bottom_elevation,
      dam_top_elevation: globalConfig.dam_top_elevation,
      dam_top_width: globalConfig.dam_top_width,
      downstream_slope: globalConfig.downstream_slope,
      material_type: materialMap[globalConfig.material_type] || globalConfig.material_type,
      permeability_coefficient: globalConfig.permeability_coefficient,
      prism_slope: globalConfig.prism_slope,
      prism_inner_slope: globalConfig.prism_inner_slope,
      prism_top_elevation: globalConfig.prism_top_elevation,
      prism_top_width: globalConfig.prism_top_width,
      step_height: globalConfig.step_height,
      step_width: globalConfig.step_width,
      reservoir_water_level: globalConfig.reservoir_water_level,
      upstream_slope: globalConfig.upstream_slope
    };

    // Construct final payload
    const payload = {
      dam_geometry: cleanDamGeometry,
      sections: mappedSections
    };

    console.log("Saving payload:", payload);
    await saveReservoirConfig(payload);
    ElMessage.success("保存成功");
  } catch (error) {
    console.error("Save failed:", error);
    ElMessage.error("保存失败");
  }
};

const onInput = () => {
  emit("syncGlobalAndDraw");
};

const onSwitchSection = (val) => {
  // val comes from the DOM event and is always a string.
  // We match it against our sections ensuring we preserve the original ID type (number or string).
  const section = props.sections.find((s) => String(s.id) === val);
  if (section) {
    emit("update:currentSectionId", section.id);
    emit("switchSection");
  }
};

const onExport = () => {
  exportReservoirConfig();
};
// 恢复初始设置
const resetReservoirConfigFun = () => {
  resetReservoirConfig()
    .then((res) => {
      ElMessage({
        message: res.message || "已恢复初始设置，请重新加载页面",
        type: "success",
        placement: "bottom-right"
      });
    })
    .catch((error) => {
      console.error("恢复初始设置失败:", error);
      ElMessage({
        message: res.message || "已恢复初始设置，请重新加载页面",
        type: "erroe",
        placement: "bottom-right"
      });
    });
};
</script>

<style scoped>
.sidebar {
  width: 300px;
  background: #ffffff;
  border-right: 1px solid #e2e8f0;
  display: flex;
  flex-direction: column;
  box-shadow: 2px 0 10px rgba(0, 0, 0, 0.05);
  z-index: 10;
  height: 100%;
}

.sidebar-scroll-area {
  flex: 1;
  overflow-y: auto;
  padding: 0;
  display: flex;
  flex-direction: column;
}

/* 滚动条美化 */
.sidebar-scroll-area::-webkit-scrollbar {
  width: 6px;
}

.sidebar-scroll-area::-webkit-scrollbar-track {
  background: #f1f5f9;
}

.sidebar-scroll-area::-webkit-scrollbar-thumb {
  background: #cbd5e1;
  border-radius: 3px;
}

.sidebar-scroll-area::-webkit-scrollbar-thumb:hover {
  background: #94a3b8;
}

.sidebar-footer {
  padding: 15px 10px;
  border-top: 1px solid #e2e8f0;
  background: #f8fafc;
  display: flex;
  justify-content: center;
  gap: 8px;
}

.accordion-item {
  border-bottom: 1px solid #e2e8f0;
}

.accordion-header {
  padding: 12px 20px;
  background: #f8fafc;
  cursor: pointer;
  display: flex;
  justify-content: space-between;
  align-items: center;
  transition: background 0.3s;
}

.accordion-header:hover {
  background: #f1f5f9;
}

.accordion-header h2 {
  margin: 0;
  font-size: 14px;
  color: #1e293b;
  font-weight: bold;
}

.accordion-content {
  max-height: 0;
  overflow: hidden;
  transition: max-height 0.3s ease-out, padding 0.3s ease;
  background: #fff;
}

.accordion-item.active .accordion-content {
  max-height: 2000px;
  padding-bottom: 20px;
}

.accordion-item.active .accordion-header {
  background: #eff6ff;
  border-bottom: 1px solid #bfdbfe;
}

.arrow-icon {
  width: 12px;
  height: 12px;
  border-right: 2px solid #64748b;
  border-bottom: 2px solid #64748b;
  transform: rotate(45deg);
  transition: transform 0.3s;
  margin-right: 5px;
}

.accordion-item.active .arrow-icon {
  transform: rotate(-135deg);
}

.global-params,
.section-params {
  padding: 15px 20px;
}

.sensor-params-nested {
  margin-top: 20px;
  border-top: 1px dashed #e2e8f0;
  padding-top: 15px;
}

.sensor-params-nested h3 {
  margin-top: 0;
  margin-bottom: 10px;
  font-size: 13px;
  color: #2563eb;
}

.toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15px;
}

h2 {
  margin: 0;
  font-size: 14px;
  color: #1e293b;
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: bold;
}

h3 {
  margin: 15px 0 8px 0;
  font-size: 12px;
  color: #2563eb;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  border-bottom: 1px solid #e2e8f0;
  padding-bottom: 4px;
}

.section-manager {
  display: flex;
  gap: 8px;
  margin-bottom: 10px;
}

select {
  flex: 1;
  padding: 8px;
  border-radius: 4px;
  border: 1px solid #e2e8f0;
  font-size: 13px;
}

.input-group {
  display: flex;
  flex-direction: column;
  gap: 3px;
  margin-bottom: 8px;
}

.input-group label {
  font-size: 11px;
  color: #64748b;
  font-weight: 600;
}

input[type="number"],
input[type="text"],
select {
  padding: 6px 8px;
  border: 1px solid #e2e8f0;
  border-radius: 4px;
  font-size: 13px;
  width: 100%;
  box-sizing: border-box;
}

.row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
}

.sensor-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 11px;
  margin-top: 5px;
}

.sensor-table th {
  text-align: left;
  color: #64748b;
  padding: 6px 4px;
  border-bottom: 1px solid #e2e8f0;
}

.sensor-table td {
  padding: 2px 0;
}

.sensor-table input {
  padding: 4px;
  width: 100%;
  box-sizing: border-box;
  border: 1px solid transparent;
}

.btn-delete {
  color: #ef4444;
  cursor: pointer;
  border: none;
  background: none;
  font-size: 16px;
}

.btn-primary {
  background: #2563eb;
  color: white;
  border: none;
  padding: 8px 12px;
  border-radius: 4px;
  cursor: pointer;
  font-weight: bold;
  font-size: 12px;
}

.btn-export {
  background: #0ea5e9;
  color: white;
  border: none;
  padding: 4px 8px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 11px;
}

.btn-add {
  background: #f8fafc;
  border: 1px dashed #64748b;
  color: #64748b;
  padding: 6px;
  margin-top: 5px;
  cursor: pointer;
  border-radius: 4px;
  font-size: 11px;
  width: 100%;
}
</style>
