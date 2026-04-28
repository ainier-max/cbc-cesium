import PlineClass from "./PlineClass.js";
import {
  STORAGE_KEY,
  cloneDefaults,
  createDefaultGlobalConfig,
  createDefaultSections
} from "./defaults.js";

const state = {
  globalConfig: createDefaultGlobalConfig(),
  sections: createDefaultSections(),
  currentSectionId: null,
  activeCollapse: "global"
};

state.currentSectionId = state.sections[0]?.id ?? null;

const dom = {
  sidebar: document.getElementById("sidebar"),
  canvasContainer: document.getElementById("structural-settings-container"),
  canvas: document.getElementById("structural-settings-canvas"),
  tooltip: document.getElementById("structural-settings-tooltip"),
  resetViewButton: document.getElementById("reset-view-button"),
  toast: document.getElementById("page-toast")
};

let plineInstance = null;
let resizeObserver = null;
let resizeFallback = null;
let toastTimer = null;

function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function formatValue(value) {
  return value === null || value === undefined ? "" : String(value);
}

function getCurrentSection() {
  return state.sections.find((item) => item.id === state.currentSectionId) || state.sections[0] || null;
}

function normalizeGlobalConfig() {
  state.globalConfig.coreWallEnabled = state.globalConfig.material_type === "earth";
  state.globalConfig.drainElev = state.globalConfig.prism_top_elevation || 0;
}

function syncInstanceData() {
  if (!plineInstance) return;
  normalizeGlobalConfig();
  plineInstance.globalConfig = state.globalConfig;
  plineInstance.sections = state.sections;
}

function applyStoredConfig(payload) {
  if (!payload) return;

  state.globalConfig = Object.assign(
    createDefaultGlobalConfig(),
    payload.globalConfig || {}
  );
  normalizeGlobalConfig();

  state.sections =
    Array.isArray(payload.sections) && payload.sections.length > 0
      ? cloneDefaults(payload.sections)
      : createDefaultSections();

  const storedSectionId = payload.currentSectionId;
  const matchedSection = state.sections.find((item) => item.id === storedSectionId);
  state.currentSectionId = matchedSection?.id ?? state.sections[0]?.id ?? null;
}

function buildPayload() {
  return {
    globalConfig: cloneDefaults(state.globalConfig),
    sections: cloneDefaults(state.sections),
    currentSectionId: state.currentSectionId
  };
}

function showToast(message, type = "success") {
  if (!dom.toast) return;
  dom.toast.textContent = message;
  dom.toast.dataset.type = type;
  dom.toast.classList.add("show");
  window.clearTimeout(toastTimer);
  toastTimer = window.setTimeout(() => {
    dom.toast.classList.remove("show");
  }, 2200);
}

function syncGlobalAndDraw() {
  syncInstanceData();
  plineInstance?.updateAndDraw();
}

function switchSection(sectionId = state.currentSectionId) {
  const targetSection = state.sections.find((item) => String(item.id) === String(sectionId));
  if (!targetSection) return;

  state.currentSectionId = targetSection.id;
  syncInstanceData();
  plineInstance?.switchSection(targetSection.id);
}

function syncSectionData() {
  syncInstanceData();
  plineInstance?.updateAndDraw();
}

function addSection() {
  const nextId = Date.now();
  state.sections = [
    ...state.sections,
    {
      id: nextId,
      name: `断面 ${String(state.sections.length + 1).padStart(2, "0")}`,
      localLevel: null,
      sensors: []
    }
  ];
  state.currentSectionId = nextId;
  renderSidebar();
  syncInstanceData();
  plineInstance?.switchSection(nextId);
}

function addSensor() {
  const currentSection = getCurrentSection();
  if (!currentSection) return;

  currentSection.sensors.push({
    id: `P${currentSection.sensors.length + 1}`,
    x: 0,
    bottom: 15,
    water: 25
  });

  renderSidebar();
  syncSectionData();
}

function removeSensor(index) {
  const currentSection = getCurrentSection();
  if (!currentSection) return;

  currentSection.sensors.splice(index, 1);
  renderSidebar();
  syncSectionData();
}

function saveConfig() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(buildPayload()));
  showToast("已保存到本地浏览器缓存");
}

function exportConfig() {
  const payload = {
    globalConfig: cloneDefaults(state.globalConfig),
    sections: cloneDefaults(state.sections)
  };
  const blob = new Blob([JSON.stringify(payload, null, 2)], {
    type: "application/json;charset=utf-8"
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");

  link.href = url;
  link.download = "structural-settings.json";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

function resetConfig() {
  state.globalConfig = createDefaultGlobalConfig();
  normalizeGlobalConfig();
  state.sections = createDefaultSections();
  state.currentSectionId = state.sections[0]?.id ?? null;
  localStorage.removeItem(STORAGE_KEY);

  renderSidebar();
  syncInstanceData();

  if (state.currentSectionId !== null && state.currentSectionId !== undefined) {
    plineInstance?.switchSection(state.currentSectionId);
  } else {
    plineInstance?.resetView();
  }

  showToast("已恢复默认配置");
}

function parseNumberInput(rawValue) {
  if (rawValue === "") return null;
  const nextValue = Number(rawValue);
  return Number.isFinite(nextValue) ? nextValue : null;
}

function updateGlobalField(key, rawValue) {
  if (key === "material_type") {
    state.globalConfig[key] = rawValue;
    normalizeGlobalConfig();
    renderSidebar();
    syncGlobalAndDraw();
    return;
  }

  const nextValue = parseNumberInput(rawValue);
  if (nextValue === null) return;
  state.globalConfig[key] = nextValue;
  syncGlobalAndDraw();
}

function updateSectionField(key, rawValue) {
  const currentSection = getCurrentSection();
  if (!currentSection) return;

  if (key === "localLevel") {
    currentSection.localLevel = rawValue === "" ? null : parseNumberInput(rawValue);
    syncSectionData();
  }
}

function updateSensorField(index, key, rawValue) {
  const currentSection = getCurrentSection();
  const sensor = currentSection?.sensors?.[index];
  if (!sensor) return;

  if (key === "id") {
    sensor.id = rawValue;
    syncSectionData();
    return;
  }

  const nextValue = parseNumberInput(rawValue);
  if (nextValue === null) return;
  sensor[key] = nextValue;
  syncSectionData();
}

function renderGlobalConfig() {
  const config = state.globalConfig;
  const materialType = config.material_type;

  return `
    <div class="panel-content">
      <div class="row">
        <div class="input-group">
          <label>全局库水位 (m)</label>
          <input data-scope="global" data-key="reservoir_water_level" type="number" step="0.1" value="${formatValue(config.reservoir_water_level)}" />
        </div>
        <div class="input-group">
          <label>坝顶高程 (m)</label>
          <input data-scope="global" data-key="dam_top_elevation" type="number" step="0.1" value="${formatValue(config.dam_top_elevation)}" />
        </div>
      </div>

      <div class="row">
        <div class="input-group">
          <label>坝底高程 (m)</label>
          <input data-scope="global" data-key="dam_bottom_elevation" type="number" step="0.1" value="${formatValue(config.dam_bottom_elevation)}" />
        </div>
        <div class="input-group">
          <label>坝顶宽度 (m)</label>
          <input data-scope="global" data-key="dam_top_width" type="number" step="0.1" value="${formatValue(config.dam_top_width)}" />
        </div>
      </div>

      <div class="row">
        <div class="input-group">
          <label>上游坝坡比 (1:m1)</label>
          <input data-scope="global" data-key="upstream_slope" type="number" step="0.1" value="${formatValue(config.upstream_slope)}" />
        </div>
        <div class="input-group">
          <label>下游坝坡比 (1:m2)</label>
          <input data-scope="global" data-key="downstream_slope" type="number" step="0.1" value="${formatValue(config.downstream_slope)}" />
        </div>
      </div>

      <div class="row">
        <div class="input-group">
          <label>马道垂直间距 (m)</label>
          <input data-scope="global" data-key="step_height" type="number" step="1" value="${formatValue(config.step_height)}" />
        </div>
        <div class="input-group">
          <label>马道宽度 (m)</label>
          <input data-scope="global" data-key="step_width" type="number" step="0.5" value="${formatValue(config.step_width)}" />
        </div>
      </div>

      <div class="row">
        <div class="input-group">
          <label>坝体材料类型</label>
          <select data-scope="global" data-key="material_type">
            <option value="earth" ${materialType === "earth" ? "selected" : ""}>土石坝（含防渗心墙）</option>
            <option value="clay" ${materialType === "clay" ? "selected" : ""}>黏土均质坝</option>
          </select>
        </div>
        <div class="input-group">
          <label>坝壳渗透系数 k (m/day)</label>
          <input data-scope="global" data-key="permeability_coefficient" type="number" step="1e-9" value="${formatValue(config.permeability_coefficient)}" />
        </div>
      </div>

      ${materialType === "earth" ? `
        <div class="section-block">
          <h3>防渗心墙参数</h3>
          <div class="row">
            <div class="input-group">
              <label>心墙顶高程 (m)</label>
              <input data-scope="global" data-key="core_top_elevation" type="number" step="0.1" value="${formatValue(config.core_top_elevation)}" />
            </div>
            <div class="input-group">
              <label>心墙顶宽 (m)</label>
              <input data-scope="global" data-key="core_top_width" type="number" step="0.1" value="${formatValue(config.core_top_width)}" />
            </div>
          </div>
          <div class="row">
            <div class="input-group">
              <label>心墙底宽 (m)</label>
              <input data-scope="global" data-key="core_bottom_width" type="number" step="0.1" value="${formatValue(config.core_bottom_width)}" />
            </div>
            <div class="input-group">
              <label>心墙渗透系数 k (m/day)</label>
              <input data-scope="global" data-key="core_permeability_coefficient" type="number" step="1e-9" value="${formatValue(config.core_permeability_coefficient)}" />
            </div>
          </div>
        </div>
      ` : ""}

      <div class="section-block">
        <h3>下游排水棱体配置</h3>
        <div class="row">
          <div class="input-group">
            <label>棱体顶高程 (m)</label>
            <input data-scope="global" data-key="prism_top_elevation" type="number" step="0.1" value="${formatValue(config.prism_top_elevation)}" />
          </div>
          <div class="input-group">
            <label>棱体顶宽度 (m)</label>
            <input data-scope="global" data-key="prism_top_width" type="number" step="0.1" value="${formatValue(config.prism_top_width)}" />
          </div>
        </div>
        <div class="row">
          <div class="input-group">
            <label>外坡比 (1:m)</label>
            <input data-scope="global" data-key="prism_slope" type="number" step="0.1" value="${formatValue(config.prism_slope)}" />
          </div>
          <div class="input-group">
            <label>内坡比 (1:m)</label>
            <input data-scope="global" data-key="prism_inner_slope" type="number" step="0.1" value="${formatValue(config.prism_inner_slope)}" />
          </div>
        </div>
      </div>
    </div>
  `;
}

function renderSectionConfig() {
  const currentSection = getCurrentSection();
  const sensors = currentSection?.sensors || [];

  return `
    <div class="panel-content">
      <div class="section-manager">
        <select data-select="section">
          ${state.sections
            .map(
              (section) => `<option value="${escapeHtml(section.id)}" ${section.id === state.currentSectionId ? "selected" : ""}>${escapeHtml(section.name)}</option>`
            )
            .join("")}
        </select>
        <button type="button" class="btn-primary" data-action="add-section">+ 新增</button>
      </div>

      <div class="input-group">
        <label>当前断面水位（留空继承全局）</label>
        <input data-scope="section" data-key="localLevel" type="number" step="0.1" placeholder="继承全局" value="${formatValue(currentSection?.localLevel)}" />
      </div>

      <div class="section-block">
        <h3>测压管数据 <span class="section-name">${escapeHtml(currentSection?.name || "")}</span></h3>
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
            ${sensors
              .map(
                (sensor, index) => `
                  <tr>
                    <td><input data-scope="sensor" data-index="${index}" data-key="id" type="text" value="${escapeHtml(sensor.id)}" /></td>
                    <td><input data-scope="sensor" data-index="${index}" data-key="x" type="number" step="0.1" value="${formatValue(sensor.x)}" /></td>
                    <td><input data-scope="sensor" data-index="${index}" data-key="bottom" type="number" step="0.1" value="${formatValue(sensor.bottom)}" /></td>
                    <td><input data-scope="sensor" data-index="${index}" data-key="water" type="number" step="0.1" value="${formatValue(sensor.water)}" /></td>
                    <td><button type="button" class="btn-delete" data-action="remove-sensor" data-index="${index}" aria-label="删除测压管">×</button></td>
                  </tr>
                `
              )
              .join("")}
          </tbody>
        </table>
        <button type="button" class="btn-add" data-action="add-sensor">+ 添加测压管</button>
      </div>
    </div>
  `;
}

function renderSidebar() {
  const globalActive = state.activeCollapse === "global";
  const sectionActive = state.activeCollapse === "section";

  dom.sidebar.innerHTML = `
    <div class="sidebar-scroll-area">
      <div class="accordion-item ${globalActive ? "active" : ""}">
        <div class="accordion-header" data-collapse="global">
          <h2>全局坝体参数配置</h2>
          <i class="arrow-icon"></i>
        </div>
        <div class="accordion-content">
          ${renderGlobalConfig()}
        </div>
      </div>

      <div class="accordion-item ${sectionActive ? "active" : ""}">
        <div class="accordion-header" data-collapse="section">
          <h2>断面切换与局部配置</h2>
          <i class="arrow-icon"></i>
        </div>
        <div class="accordion-content">
          ${renderSectionConfig()}
        </div>
      </div>
    </div>

    <div class="sidebar-footer">
      <button type="button" class="footer-btn footer-btn-primary" data-action="save-config">保存</button>
      <button type="button" class="footer-btn footer-btn-primary" data-action="export-config">导出</button>
      <button type="button" class="footer-btn footer-btn-secondary" data-action="reset-config">恢复默认</button>
    </div>
  `;
}

function initPlineClass() {
  if (!dom.canvas || !dom.canvasContainer || !dom.tooltip) return;

  plineInstance?.destroy?.();
  normalizeGlobalConfig();

  plineInstance = new PlineClass(
    "structural-settings-canvas",
    "structural-settings-container",
    "structural-settings-tooltip"
  );

  plineInstance.init({
    sections: state.sections,
    globalConfig: state.globalConfig
  });

  if (state.currentSectionId !== null && state.currentSectionId !== undefined) {
    plineInstance.switchSection(state.currentSectionId);
  }
}

function setupResizeHandling() {
  if (typeof ResizeObserver === "function") {
    resizeObserver = new ResizeObserver(() => {
      plineInstance?.resizeCanvas(false);
      plineInstance?.resetView();
    });
    if (dom.canvasContainer) {
      resizeObserver.observe(dom.canvasContainer);
    }
    return;
  }

  resizeFallback = () => {
    plineInstance?.resizeCanvas(false);
    plineInstance?.resetView();
  };
  window.addEventListener("resize", resizeFallback);
}

function attachEvents() {
  dom.sidebar.addEventListener("click", (event) => {
    const collapseTarget = event.target.closest("[data-collapse]");
    if (collapseTarget) {
      const key = collapseTarget.dataset.collapse;
      state.activeCollapse = state.activeCollapse === key ? "" : key;
      renderSidebar();
      return;
    }

    const actionTarget = event.target.closest("[data-action]");
    if (!actionTarget) return;

    const { action, index } = actionTarget.dataset;
    switch (action) {
      case "add-section":
        addSection();
        break;
      case "add-sensor":
        addSensor();
        break;
      case "remove-sensor":
        removeSensor(Number(index));
        break;
      case "save-config":
        saveConfig();
        break;
      case "export-config":
        exportConfig();
        break;
      case "reset-config":
        resetConfig();
        break;
      default:
        break;
    }
  });

  dom.sidebar.addEventListener("input", (event) => {
    const target = event.target;
    if (!(target instanceof HTMLInputElement)) return;

    const scope = target.dataset.scope;
    const key = target.dataset.key;
    if (!scope || !key) return;

    if (scope === "global") {
      updateGlobalField(key, target.value);
      return;
    }

    if (scope === "section") {
      updateSectionField(key, target.value);
      return;
    }

    if (scope === "sensor") {
      updateSensorField(Number(target.dataset.index), key, target.value);
    }
  });

  dom.sidebar.addEventListener("change", (event) => {
    const target = event.target;
    if (!(target instanceof HTMLInputElement || target instanceof HTMLSelectElement)) return;

    if (target instanceof HTMLSelectElement && target.dataset.select === "section") {
      switchSection(target.value);
      renderSidebar();
      return;
    }

    const scope = target.dataset.scope;
    const key = target.dataset.key;
    if (scope === "global" && key === "material_type") {
      updateGlobalField(key, target.value);
    }
  });

  dom.resetViewButton?.addEventListener("click", () => {
    plineInstance?.resetView();
  });
}

function restoreState() {
  const storedRaw = localStorage.getItem(STORAGE_KEY);
  if (!storedRaw) {
    normalizeGlobalConfig();
    return;
  }

  try {
    applyStoredConfig(JSON.parse(storedRaw));
  } catch (error) {
    console.error("Failed to parse structural-settings cache", error);
    normalizeGlobalConfig();
  }
}

function boot() {
  restoreState();
  attachEvents();
  renderSidebar();
  initPlineClass();
  setupResizeHandling();
}

window.addEventListener("beforeunload", () => {
  resizeObserver?.disconnect();
  if (resizeFallback) {
    window.removeEventListener("resize", resizeFallback);
  }
  plineInstance?.destroy?.();
  plineInstance = null;
});

boot();
