<template>
  <div class="sidebar">
    <div class="sidebar-scroll-area">
      <div class="accordion-item" :class="{ active: activeCollapse === 'global' }">
        <div class="accordion-header" @click="toggleCollapse('global')">
          <h2>全局坝体参数配置</h2>
          <i class="arrow-icon"></i>
        </div>
        <div class="accordion-content">
          <div class="panel-content">
            <div class="row">
              <div class="input-group">
                <label>全局库水位 (m)</label>
                <input
                  v-model.number="globalConfig.reservoir_water_level"
                  type="number"
                  step="0.1"
                  @input="onInput"
                />
              </div>
              <div class="input-group">
                <label>坝顶高程 (m)</label>
                <input
                  v-model.number="globalConfig.dam_top_elevation"
                  type="number"
                  @input="onInput"
                />
              </div>
            </div>

            <div class="row">
              <div class="input-group">
                <label>坝底高程 (m)</label>
                <input
                  v-model.number="globalConfig.dam_bottom_elevation"
                  type="number"
                  @input="onInput"
                />
              </div>
              <div class="input-group">
                <label>坝顶宽度 (m)</label>
                <input
                  v-model.number="globalConfig.dam_top_width"
                  type="number"
                  @input="onInput"
                />
              </div>
            </div>

            <div class="row">
              <div class="input-group">
                <label>上游坝坡比 (1:m1)</label>
                <input
                  v-model.number="globalConfig.upstream_slope"
                  type="number"
                  step="0.1"
                  @input="onInput"
                />
              </div>
              <div class="input-group">
                <label>下游坝坡比 (1:m2)</label>
                <input
                  v-model.number="globalConfig.downstream_slope"
                  type="number"
                  step="0.1"
                  @input="onInput"
                />
              </div>
            </div>

            <div class="row">
              <div class="input-group">
                <label>马道垂直间距 (m)</label>
                <input
                  v-model.number="globalConfig.step_height"
                  type="number"
                  step="1"
                  @input="onInput"
                />
              </div>
              <div class="input-group">
                <label>马道宽度 (m)</label>
                <input
                  v-model.number="globalConfig.step_width"
                  type="number"
                  step="0.5"
                  @input="onInput"
                />
              </div>
            </div>

            <div class="row">
              <div class="input-group">
                <label>坝体材料类型</label>
                <select v-model="globalConfig.material_type" @change="onInput">
                  <option value="earth">土石坝（含防渗心墙）</option>
                  <option value="clay">黏土均质坝</option>
                </select>
              </div>
              <div class="input-group">
                <label>坝壳渗透系数 k (m/day)</label>
                <input
                  v-model.number="globalConfig.permeability_coefficient"
                  type="number"
                  step="1e-9"
                  @input="onInput"
                />
              </div>
            </div>

            <div v-if="globalConfig.material_type === 'earth'" class="section-block">
              <h3>防渗心墙参数</h3>
              <div class="row">
                <div class="input-group">
                  <label>心墙顶高程 (m)</label>
                  <input
                    v-model.number="globalConfig.core_top_elevation"
                    type="number"
                    @input="onInput"
                  />
                </div>
                <div class="input-group">
                  <label>心墙顶宽 (m)</label>
                  <input
                    v-model.number="globalConfig.core_top_width"
                    type="number"
                    @input="onInput"
                  />
                </div>
              </div>
              <div class="row">
                <div class="input-group">
                  <label>心墙底宽 (m)</label>
                  <input
                    v-model.number="globalConfig.core_bottom_width"
                    type="number"
                    @input="onInput"
                  />
                </div>
                <div class="input-group">
                  <label>心墙渗透系数 k (m/day)</label>
                  <input
                    v-model.number="globalConfig.core_permeability_coefficient"
                    type="number"
                    step="1e-9"
                    @input="onInput"
                  />
                </div>
              </div>
            </div>

            <div class="section-block">
              <h3>下游排水棱体配置</h3>
              <div class="row">
                <div class="input-group">
                  <label>棱体顶高程 (m)</label>
                  <input
                    v-model.number="globalConfig.prism_top_elevation"
                    type="number"
                    @input="onInput"
                  />
                </div>
                <div class="input-group">
                  <label>棱体顶宽度 (m)</label>
                  <input
                    v-model.number="globalConfig.prism_top_width"
                    type="number"
                    @input="onInput"
                  />
                </div>
              </div>
              <div class="row">
                <div class="input-group">
                  <label>外坡比 (1:m)</label>
                  <input
                    v-model.number="globalConfig.prism_slope"
                    type="number"
                    step="0.1"
                    @input="onInput"
                  />
                </div>
                <div class="input-group">
                  <label>内坡比 (1:m)</label>
                  <input
                    v-model.number="globalConfig.prism_inner_slope"
                    type="number"
                    step="0.1"
                    @input="onInput"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="accordion-item" :class="{ active: activeCollapse === 'section' }">
        <div class="accordion-header" @click="toggleCollapse('section')">
          <h2>断面切换与局部配置</h2>
          <i class="arrow-icon"></i>
        </div>
        <div class="accordion-content">
          <div class="panel-content">
            <div class="section-manager">
              <select :value="currentSectionId" @change="onSwitchSection($event.target.value)">
                <option
                  v-for="section in sections"
                  :key="section.id"
                  :value="section.id"
                >
                  {{ section.name }}
                </option>
              </select>
              <button type="button" class="btn-primary" @click="emit('addSection')">
                + 新增
              </button>
            </div>

            <div class="input-group">
              <label>当前断面水位 (留空继承全局)</label>
              <input
                v-model.number="currentSection.localLevel"
                type="number"
                placeholder="继承全局"
                @input="emit('syncSectionData')"
              />
            </div>

            <div class="section-block">
              <h3>
                测压管数据
                <span class="section-name">{{ currentSection.name }}</span>
              </h3>
              <table class="sensor-table">
                <thead>
                  <tr>
                    <th>编号</th>
                    <th>X 距离</th>
                    <th>底高程</th>
                    <th>水位</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  <tr
                    v-for="(sensor, index) in currentSection.sensors"
                    :key="`${currentSection.id}-${index}`"
                  >
                    <td>
                      <input v-model="sensor.id" type="text" @input="emit('draw')" />
                    </td>
                    <td>
                      <input v-model.number="sensor.x" type="number" @input="emit('draw')" />
                    </td>
                    <td>
                      <input v-model.number="sensor.bottom" type="number" @input="emit('draw')" />
                    </td>
                    <td>
                      <input v-model.number="sensor.water" type="number" @input="emit('draw')" />
                    </td>
                    <td>
                      <button
                        type="button"
                        class="btn-delete"
                        @click="emit('removeSensor', index)"
                      >
                        ×
                      </button>
                    </td>
                  </tr>
                </tbody>
              </table>
              <button type="button" class="btn-add" @click="emit('addSensor')">
                + 添加测压管
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div class="sidebar-footer">
      <el-button type="primary" size="small" @click="emit('saveConfig')">保存</el-button>
      <el-button type="primary" size="small" @click="emit('exportConfig')">导出</el-button>
      <el-button type="info" size="small" plain @click="emit('resetConfig')">恢复默认</el-button>
    </div>
  </div>
</template>

<script setup>
import { computed, ref } from "vue";

const props = defineProps({
  globalConfig: { type: Object, required: true },
  sections: { type: Array, required: true },
  currentSectionId: { type: [Number, String], required: true }
});

const emit = defineEmits([
  "update:currentSectionId",
  "syncGlobalAndDraw",
  "switchSection",
  "addSection",
  "syncSectionData",
  "draw",
  "removeSensor",
  "addSensor",
  "saveConfig",
  "exportConfig",
  "resetConfig"
]);

const activeCollapse = ref("global");

const currentSection = computed(() => {
  return props.sections.find((item) => item.id === props.currentSectionId) || props.sections[0];
});

function toggleCollapse(key) {
  activeCollapse.value = activeCollapse.value === key ? "" : key;
}

function onInput() {
  emit("syncGlobalAndDraw");
}

function onSwitchSection(value) {
  const section = props.sections.find((item) => String(item.id) === String(value));
  if (!section) return;
  emit("update:currentSectionId", section.id);
  emit("switchSection", section.id);
}
</script>

<style scoped>
.sidebar {
  width: 320px;
  background: #fff;
  border-right: 1px solid #e2e8f0;
  display: flex;
  flex-direction: column;
  box-shadow: 2px 0 10px rgba(15, 23, 42, 0.06);
}

.sidebar-scroll-area {
  flex: 1;
  overflow-y: auto;
}

.sidebar-scroll-area::-webkit-scrollbar {
  width: 6px;
}

.sidebar-scroll-area::-webkit-scrollbar-thumb {
  background: #cbd5e1;
  border-radius: 999px;
}

.sidebar-footer {
  display: flex;
  justify-content: center;
  gap: 8px;
  padding: 14px 10px;
  border-top: 1px solid #e2e8f0;
  background: #f8fafc;
}

.accordion-item {
  border-bottom: 1px solid #e2e8f0;
}

.accordion-header {
  padding: 14px 18px;
  background: #f8fafc;
  cursor: pointer;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.accordion-header:hover {
  background: #eff6ff;
}

.accordion-header h2 {
  margin: 0;
  font-size: 14px;
  color: #1e293b;
}

.accordion-content {
  max-height: 0;
  overflow: hidden;
  transition: max-height 0.25s ease, padding 0.25s ease;
}

.accordion-item.active .accordion-content {
  max-height: 2000px;
}

.arrow-icon {
  width: 10px;
  height: 10px;
  border-right: 2px solid #64748b;
  border-bottom: 2px solid #64748b;
  transform: rotate(45deg);
  transition: transform 0.25s ease;
}

.accordion-item.active .arrow-icon {
  transform: rotate(-135deg);
}

.panel-content {
  padding: 14px 18px 18px;
}

.row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
}

.input-group {
  display: flex;
  flex-direction: column;
  gap: 4px;
  margin-bottom: 10px;
}

.input-group label {
  font-size: 11px;
  color: #64748b;
  font-weight: 600;
}

input,
select {
  width: 100%;
  box-sizing: border-box;
  padding: 7px 8px;
  border: 1px solid #cbd5e1;
  border-radius: 6px;
  font-size: 13px;
}

.section-block {
  margin-top: 14px;
  padding-top: 12px;
  border-top: 1px dashed #dbeafe;
}

.section-block h3 {
  margin: 0 0 10px;
  font-size: 12px;
  color: #2563eb;
}

.section-name {
  margin-left: 6px;
  color: #0f172a;
}

.section-manager {
  display: flex;
  gap: 8px;
  margin-bottom: 10px;
}

.sensor-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 12px;
}

.sensor-table th {
  padding: 6px 4px;
  text-align: left;
  color: #64748b;
  border-bottom: 1px solid #e2e8f0;
}

.sensor-table td {
  padding: 4px 2px;
}

.sensor-table input {
  padding: 5px 6px;
}

.btn-primary,
.btn-add {
  border: none;
  border-radius: 6px;
  cursor: pointer;
}

.btn-primary {
  padding: 0 12px;
  background: #2563eb;
  color: #fff;
  font-size: 12px;
}

.btn-add {
  width: 100%;
  margin-top: 8px;
  padding: 8px 10px;
  background: #eff6ff;
  color: #1d4ed8;
  font-size: 12px;
}

.btn-delete {
  border: none;
  background: transparent;
  color: #dc2626;
  cursor: pointer;
  font-size: 18px;
}
</style>
