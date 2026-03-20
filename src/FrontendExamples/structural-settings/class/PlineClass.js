/**
 * PlineClass - 大坝剖面线可视化类
 *
 * 该类用于在 Canvas 上绘制大坝剖面图，包括：
 * - 大坝主体结构（上游坡、下游坡、坝顶）
 * - 防渗心墙（可选）
 * - 排水棱体
 * - 库水位区域
 * - 浸润线和饱和区
 * - 测压管（监测孔）
 * - 坝轴线
 *
 * 支持交互功能：
 * - 鼠标滚轮缩放
 * - 鼠标拖拽平移
 * - 鼠标悬停显示测压管信息
 *
 * @class PlineClass
 */
class PlineClass {

  /**
   * 构造函数 - 初始化大坝剖面可视化实例
   *
   * @param {string} canvasId - Canvas 元素的 ID
   * @param {string} containerId - 容器元素的 ID（用于事件监听和尺寸计算）
   * @param {string} tooltipId - 提示框元素的 ID（用于显示测压管信息）
   */
  constructor(canvasId, containerId, tooltipId) {
    // ========== DOM 元素引用 ==========
    /** @type {HTMLCanvasElement} Canvas 元素 */
    this.canvas = document.getElementById(canvasId);
    /** @type {CanvasRenderingContext2D} Canvas 2D 渲染上下文 */
    this.ctx = this.canvas.getContext("2d");
    /** @type {HTMLElement} 容器元素 */
    this.container = document.getElementById(containerId);
    /** @type {HTMLElement} 提示框元素 */
    this.tooltip = document.getElementById(tooltipId);

    // ========== 数据配置 ==========
    /**
     * 全局配置 - 大坝几何参数和全局水位
     * 在 init 方法中通过参数传入
     * @type {Object|null}
     * @property {number} reservoir_water_level - 全局库水位 (m)
     * @property {number} dam_top_elevation - 坝顶高程 (m)
     * @property {number} dam_bottom_elevation - 坝底高程 (m)
     * @property {number} dam_top_width - 坝顶宽度 (m)
     * @property {number} upstream_slope - 上游坡比 (1:upstream_slope)
     * @property {number} downstream_slope - 下游坡比 (1:downstream_slope)
     * @property {boolean} coreWallEnabled - 是否启用防渗心墙
     * @property {number} core_top_elevation - 心墙顶高程 (m)
     * @property {number} core_top_width - 心墙顶宽 (m)
     * @property {number} core_bottom_width - 心墙底宽 (m)
     * @property {number} core_permeability_coefficient - 心墙渗透系数 (m/s)
     * @property {number} prism_top_elevation - 排水棱体顶高程 (m, 0为不启用)
     */
    this.globalConfig = null;

    /**
     * 断面数据数组 - 每个断面包含名称、本地水位和测压管数据
     * 在 init 方法中通过参数传入
     * @type {Array<Object>|null}
     * @property {number} id - 断面唯一标识
     * @property {string} name - 断面名称
     * @property {number|null} localLevel - 本地库水位 (m, null 表示使用全局水位)
     * @property {Array<Object>} sensors - 测压管数组
     *   @property {string} id - 测压管编号
     *   @property {number} x - 轴距 (m, 相对于坝轴线)
     *   @property {number} bottom - 测压管底高程 (m)
     *   @property {number} water - 测压管水位 (m)
     */
    this.sections = null;

    // ========== 状态管理 ==========
    /** @type {number|null} 当前选中的断面 ID，在 init 方法中通过参数传入 */
    this.currentSectionId = null;

    /**
     * 视图变换参数
     * @type {Object}
     * @property {number} x - 画布 X 轴偏移量 (像素)
     * @property {number} y - 画布 Y 轴偏移量 (像素)
     * @property {number} scale - 缩放比例
     */
    this.transform = { x: 0, y: 0, scale: 1 };

    /** @type {boolean} 是否正在拖拽 */
    this.isDragging = false;

    /** @type {Object} 上次鼠标位置 {x, y} */
    this.lastMousePos = { x: 0, y: 0 };

    /** @type {Object|null} 当前悬停的测压管对象 */
    this.hoveredSensor = null;

    /** @type {Array<Object>|null} 来自 API 的理论浸润线数据 */
    this.apiTheoreticalLine = null;

    /** @type {boolean} 理论浸润线可见性状态 */
    this.showTheoreticalLine = true;

    /** @type {boolean} 实测浸润线（测压管水位线）可见性状态 */
    this.showActualPhreaticLine = true;

    /** @type {Array<Object>|null} 来自 API 的警戒浸润线数据 */
    this.apiWarningLine = null;

    /** @type {boolean} 警戒浸润线可见性状态 */
    this.showWarningLine = true;

    /** @type {Array<Object>|null} 历史浸润线数据 */
    this.apiHistoricalLine = null;

    /** @type {boolean} 历史浸润线可见性状态 */
    this.showHistoricalLine = true;

    // ========== 颜色配置 ==========
    /** @type {string} 实测浸润线颜色 */
    this.actualPhreaticLineColor = "#FF7D3E";
    /** @type {string} 历史浸润线颜色 */
    this.historicalLineColor = "#FFCF38";
    /** @type {string} 理论浸润线颜色 */
    this.theoreticalLineColor = "#FF4848";
    /** @type {string} 警戒浸润线颜色 */
    this.warningLineColor = "#F661FF";

    this.handleWheel = null;
    this.handleMouseDown = null;
    this.handleMouseMove = null;
    this.handleMouseUp = null;
  }

  /**
   * 初始化方法 - 设置事件监听、调整画布大小并重置视图
   * 应在创建实例后立即调用
   *
   * @param {Object} paramObj - 参数对象
   * @param {Array<Object>} paramObj.sections - 断面数据数组，每个断面包含名称、本地水位和测压管数据
   * @param {Object} paramObj.globalConfig - 全局配置对象，包含大坝几何参数和全局水位
   * @param {number} paramObj.globalConfig.reservoir_water_level - 全局库水位 (m)
   * @param {number} paramObj.globalConfig.dam_top_elevation - 坝顶高程 (m)
   * @param {number} paramObj.globalConfig.dam_bottom_elevation - 坝底高程 (m)
   * @param {number} paramObj.globalConfig.dam_top_width - 坝顶宽度 (m)
   * @param {number} paramObj.globalConfig.upstream_slope - 上游坡比 (1:upstream_slope)
   * @param {number} paramObj.globalConfig.downstream_slope - 下游坡比 (1:downstream_slope)
   * @param {boolean} paramObj.globalConfig.coreWallEnabled - 是否启用防渗心墙
   * @param {number} paramObj.globalConfig.core_top_elevation - 心墙顶高程 (m)
   * @param {number} paramObj.globalConfig.core_top_width - 心墙顶宽 (m)
   * @param {number} paramObj.globalConfig.core_bottom_width - 心墙底宽 (m)
   * @param {number} paramObj.globalConfig.core_permeability_coefficient - 心墙渗透系数 (m/s)
   * @param {number} paramObj.globalConfig.prism_top_elevation - 排水棱体顶高程 (m, 0为不启用)
   */
  init(paramObj) {
    // 设置全局配置
    this.globalConfig = paramObj.globalConfig;

    // 设置断面数据
    this.sections = paramObj.sections;

    // 自动选择第一个断面作为当前断面（如果存在）
    if (this.sections && this.sections.length > 0) {
      this.currentSectionId = this.sections[0].id;
    } else {
      console.warn("断面数据数组为空");
      this.currentSectionId = null;
    }

    this.setupEventListeners();
    this.resizeCanvas(false);
    this.resetView(false);
  }

  /**
   * 切换断面 - 更新当前选中的断面并重新绘制
   *
   * @param {number} sectionId - 要切换到的断面 ID
   */
  switchSection(sectionId) {
    // 检查断面是否存在
    const section = this.sections.find((s) => s.id === sectionId);
    if (!section) {
      console.warn(`断面 ID ${sectionId} 不存在`);
      return;
    }

    // 更新当前断面 ID
    this.currentSectionId = sectionId;

    // 清除悬停状态
    this.hoveredSensor = null;
    if (this.tooltip) {
      this.tooltip.style.display = "none";
    }

    // 清空旧断面的浸润线数据
    this.apiTheoreticalLine = null;
    this.apiWarningLine = null;
    this.apiHistoricalLine = null;

    // 重置视图并重新绘制
    this.resetView();
  }

  /**
   * 更新特定断面的水位数据（库水位和测压管水位）
   *
   * @param {string|number} sectionId - 断面 ID
   * @param {number|null} reservoirLevel - 新的库水位 (m)，如果为 null 则不更新
   * @param {Array<Object>} sensorData - 测压管数据列表，项包含 sensor_id/name/point_id 和 values 数组
   */
  updateWaterLevels(sectionId, reservoirLevel, sensorData) {
    console.log("updateWaterLevels", sectionId, reservoirLevel, sensorData);

    const section = this.sections.find((s) => s.id === sectionId);
    if (!section) return;

    // 更新库水位
    if (reservoirLevel !== null && reservoirLevel !== undefined) {
      section.localLevel = reservoirLevel;
    }

    // 更新测压管水位
    if (sensorData && Array.isArray(sensorData)) {
      sensorData.forEach((item) => {
        const sId = String(item.sensor_id || item.name || item.point_id || "").toLowerCase();
        const sensor = section.sensors.find((p) => {
          const pId = String(p.id || "").toLowerCase();
          return pId === sId || sId.includes(pId) || pId.includes(sId);
        });

        if (sensor && item.values && item.values.length > 0) {
          sensor.water = item.values[0];
        }
      });
    }

    // 如果当前正在显示该断面，则重新绘制
    if (this.currentSectionId === sectionId) {
      this.updateAndDraw();
    }
  }

  /**
   * 更新理论浸润线数据（来自 API）
   *
   * @param {string|number} sectionId - 断面 ID
   * @param {Array<Object>} points - 浸润线路径点数组 [{x, y}, ...]
   */
  updateTheoreticalLine(sectionId, points) {
    console.log("updateTheoreticalLine - target:", sectionId, "current:", this.currentSectionId);

    // 只有当断面 ID 匹配时才更新
    if (this.currentSectionId == sectionId) {
      this.apiTheoreticalLine = points;
      this.updateAndDraw();
    }
  }

  /**
   * 设置理论浸润线的可见性
   *
   * @param {boolean} visible - 是否显示理论浸润线
   */
  setTheoreticalLineVisibility(visible) {
    this.showTheoreticalLine = visible;
    this.updateAndDraw();
  }

  /**
   * 设置实测浸润线的可见性（坝体浸润线）
   *
   * @param {boolean} visible - 是否显示实测浸润线
   */
  setActualPhreaticLineVisibility(visible) {
    this.showActualPhreaticLine = visible;
    this.updateAndDraw();
  }

  /**
   * 更新警戒浸润线数据（来自 API）
   *
   * @param {string|number} sectionId - 断面 ID
   * @param {Array<Object>} points - 浸润线路径点数组 [{x, y}, ...]
   */
  updateWarningLine(sectionId, points) {
    console.log("updateWarningLine - target:", sectionId, "current:", this.currentSectionId);

    // 只有当断面 ID 匹配时才更新
    if (this.currentSectionId == sectionId) {
      this.apiWarningLine = points;
      this.updateAndDraw();
    }
  }

  /**
   * 设置警戒浸润线的可见性
   *
   * @param {boolean} visible - 是否显示警戒浸润线
   */
  setWarningLineVisibility(visible) {
    this.showWarningLine = visible;
    this.updateAndDraw();
  }

  /**
   * 更新历史浸润线数据
   *
   * @param {string|number} sectionId - 断面 ID
   * @param {Array<Object>} points - 浸润线路径点数组 [{x, y}, ...]
   */
  updateHistoricalLine(sectionId, points) {
    console.log("updateHistoricalLine - target:", sectionId, "points:", points);

    // 只有当断面 ID 匹配时才更新
    if (this.currentSectionId == sectionId) {
      this.apiHistoricalLine = points;
      this.updateAndDraw();
    }
  }

  /**
   * 设置历史浸润线的可见性
   *
   * @param {boolean} visible - 是否显示历史浸润线
   */
  setHistoricalLineVisibility(visible) {
    this.showHistoricalLine = visible;
    this.updateAndDraw();
  }

  /**
   * 设置实测浸润线颜色
   * @param {string} color
   */
  setActualPhreaticLineColor(color) {
    this.actualPhreaticLineColor = color;
    this.updateAndDraw();
  }

  /**
   * 设置历史浸润线颜色
   * @param {string} color
   */
  setHistoricalLineColor(color) {
    this.historicalLineColor = color;
    this.updateAndDraw();
  }

  /**
   * 设置理论浸润线颜色
   * @param {string} color
   */
  setTheoreticalLineColor(color) {
    this.theoreticalLineColor = color;
    this.updateAndDraw();
  }

  /**
   * 设置警戒浸润线颜色
   * @param {string} color
   */
  setWarningLineColor(color) {
    this.warningLineColor = color;
    this.updateAndDraw();
  }

  /**
   * 设置事件监听器
   * 包括：鼠标滚轮缩放、鼠标拖拽平移、鼠标悬停检测
   */
  setupEventListeners() {
    this.removeEventListeners();
    // 鼠标滚轮缩放事件
    this.handleWheel = (e) => {
      e.preventDefault();

      // 计算缩放因子（基于滚轮滚动距离）
      const factor = Math.pow(1.1, -e.deltaY / 150);

      // 获取鼠标在容器中的位置
      const mouseX = e.clientX - this.container.offsetLeft;
      const mouseY = e.clientY - this.container.offsetTop;

      // 计算鼠标指向的世界坐标（缩放前）
      const wx = (mouseX - this.transform.x) / this.transform.scale;
      const wy = (mouseY - this.transform.y) / this.transform.scale;

      // 应用缩放（限制在 0.01 到 50 倍之间）
      this.transform.scale = Math.max(0.01, Math.min(this.transform.scale * factor, 50));

      // 调整偏移量，使鼠标指向的世界坐标保持不变
      this.transform.x = mouseX - wx * this.transform.scale;
      this.transform.y = mouseY - wy * this.transform.scale;

      // 重新绘制
      this.updateAndDraw();
    };
    this.container.addEventListener("wheel", this.handleWheel);

    // 鼠标按下事件 - 开始拖拽
    this.handleMouseDown = (e) => {
      this.isDragging = true;
      this.lastMousePos = { x: e.clientX, y: e.clientY };
      this.container.style.cursor = "grabbing";
      // 清除悬停状态，隐藏提示框
      if (this.hoveredSensor) {
        this.hoveredSensor = null;
        if (this.tooltip) {
          this.tooltip.style.display = "none";
        }
        this.updateAndDraw();
      }
    };
    this.container.addEventListener("mousedown", this.handleMouseDown);

    // 鼠标移动事件 - 处理拖拽和悬停检测
    this.handleMouseMove = (e) => {
      const rect = this.container.getBoundingClientRect();
      const mx = e.clientX - rect.left; // 鼠标在容器中的 X 坐标
      const my = e.clientY - rect.top; // 鼠标在容器中的 Y 坐标

      // 如果正在拖拽，更新视图偏移量
      if (this.isDragging) {
        this.transform.x += e.clientX - this.lastMousePos.x;
        this.transform.y += e.clientY - this.lastMousePos.y;
        this.lastMousePos = { x: e.clientX, y: e.clientY };
        this.updateAndDraw();
        // 拖拽时隐藏提示框，但保持鼠标样式检测
        if (this.tooltip) {
          this.tooltip.style.display = "none";
        }
      } else {
        // 非拖拽状态下才检测悬停并显示提示框
        this.checkHover(mx, my);
      }
    };
    window.addEventListener("mousemove", this.handleMouseMove);

    // 鼠标释放事件 - 结束拖拽
    this.handleMouseUp = () => {
      this.isDragging = false;
      this.container.style.cursor = "grab";
    };
    window.addEventListener("mouseup", this.handleMouseUp);
  }

  removeEventListeners() {
    if (this.container && this.handleWheel) {
      this.container.removeEventListener("wheel", this.handleWheel);
    }
    if (this.container && this.handleMouseDown) {
      this.container.removeEventListener("mousedown", this.handleMouseDown);
    }
    if (this.handleMouseMove) {
      window.removeEventListener("mousemove", this.handleMouseMove);
    }
    if (this.handleMouseUp) {
      window.removeEventListener("mouseup", this.handleMouseUp);
    }

    this.handleWheel = null;
    this.handleMouseDown = null;
    this.handleMouseMove = null;
    this.handleMouseUp = null;
  }

  // ========== 几何计算工具方法 ==========

  /**
   * 根据 X 坐标计算大坝表面的 Y 坐标（高程）
   *
   * @param {number} x - 轴距 (m, 相对于坝轴线，负值为上游侧，正值为下游侧)
   * @param {Object} g - 全局配置对象
   * @returns {number|null} 高程值 (m)，如果 X 坐标不在大坝范围内则返回 null
   */
  getDamSurfaceY(x, g) {
    const h = g.dam_top_elevation - g.dam_bottom_elevation; // 大坝高度
    const tLX = -g.dam_top_width / 2; // 坝顶左边界 X 坐标
    const tRX = g.dam_top_width / 2; // 坝顶右边界 X 坐标
    const bLX = tLX - h * g.upstream_slope; // 坝底左边界 X 坐标（上游坡）
    const bRX = tRX + h * g.downstream_slope; // 坝底右边界 X 坐标（下游坡）

    // 如果 X 坐标不在大坝范围内，返回 null
    if (x < bLX || x > bRX) return null;

    // 上游坡区域
    if (x < tLX) {
      return g.dam_bottom_elevation + ((x - bLX) / (tLX - bLX)) * h;
    }

    // 坝顶区域
    if (x <= tRX) {
      return g.dam_top_elevation;
    }

    // 下游坡区域
    if (g.step_height > 0) {
      // 计算从坝顶到排水棱体顶部的垂直距离
      const drainTopElev = g.prism_top_elevation || g.dam_bottom_elevation;
      const H_slope = g.dam_top_elevation - drainTopElev;

      // 如果高度差过小或当前点在排水体以下，不应用台阶逻辑
      if (H_slope <= 0 || (g.prism_top_elevation > g.dam_bottom_elevation && x > bRX - (drainTopElev - g.dam_bottom_elevation) * g.downstream_slope)) {
        return g.dam_top_elevation - ((x - tRX) / (bRX - tRX)) * h;
      }

      // 计算有效坡比 (参考 PLine2Bycbc.html)
      const L_total = H_slope * g.downstream_slope;
      const stepCount = Math.floor((H_slope - 0.01) / g.step_height);
      const totalBermWidth = stepCount * (g.step_width || 0);

      let effectiveM2 = g.downstream_slope;
      if (H_slope > 0) {
        effectiveM2 = Math.max(0, (L_total - totalBermWidth) / H_slope);
      }

      let curX = tRX, curY = g.dam_top_elevation;
      while (curY > drainTopElev) {
        const drop = Math.min(g.step_height, curY - drainTopElev);
        const run = drop * effectiveM2;
        const nextX = curX + run;
        const nextY = curY - drop;

        if (x <= nextX) return curY - (x - curX) / (effectiveM2 || 1); // 在斜坡上
        curX = nextX;
        curY = nextY;

        if (curY <= drainTopElev + 0.01) break;

        const nextBermX = curX + (g.step_width || 0);
        if (x <= nextBermX) return curY; // 在马道上
        curX = nextBermX;
      }
      // 如果超出了台阶处理范围（进入排水体区域）
      return g.dam_top_elevation - ((x - tRX) / (bRX - tRX)) * h;
    }

    return g.dam_top_elevation - ((x - tRX) / (bRX - tRX)) * h;
  }

  /**
   * 根据 Y 坐标（高程）计算心墙在该高程处的左右边界
   *
   * @param {number} y - 高程 (m)
   * @param {Object} g - 全局配置对象
   * @returns {Object|null} 返回 {left, right} 对象，表示心墙左右边界的 X 坐标
   *                       如果心墙未启用或 Y 坐标不在心墙范围内，返回 null
   */
  getCoreRangeAtY(y, g) {
    // 检查心墙是否启用，以及 Y 坐标是否在心墙范围内
    if (!g.coreWallEnabled || y < g.dam_bottom_elevation || y > g.core_top_elevation) {
      return null;
    }

    const h = g.core_top_elevation - g.dam_bottom_elevation; // 心墙高度
    const ratio = (y - g.dam_bottom_elevation) / h; // 当前高程在心墙中的比例（0-1）

    // 根据比例计算当前高程处的心墙宽度（线性插值）
    const halfW = (g.core_bottom_width + (g.core_top_width - g.core_bottom_width) * ratio) / 2;

    return { left: -halfW, right: halfW };
  }

  /**
   * 获取下游坡的所有线段点（含台阶）
   * @param {Object} g - 全局配置
   * @param {number} tRX - 坝顶右边缘 X
   * @param {number} drainInnerX - 排水体内侧顶点的 X
   * @param {number} drainTopElev - 排水体顶高程
   * @returns {Array} 点数组 [{x, y}, ...]
   */
  getDownstreamSlopePoints(g, tRX, drainInnerX, drainTopElev) {
    const points = [{ x: tRX, y: g.dam_top_elevation }];
    if (g.step_height > 0) {
      const H_slope = g.dam_top_elevation - drainTopElev;
      const L_total = H_slope * g.downstream_slope;
      const stepCount = Math.floor((H_slope - 0.01) / g.step_height);
      const totalBermWidth = stepCount * (g.step_width || 0);

      let effectiveM2 = g.downstream_slope;
      if (H_slope > 0) {
        effectiveM2 = Math.max(0, (L_total - totalBermWidth) / H_slope);
      }

      let curX = tRX, curY = g.dam_top_elevation;
      while (curY > drainTopElev) {
        // 坡段
        const drop = Math.min(g.step_height, curY - drainTopElev);
        const run = drop * effectiveM2;
        curX += run;
        curY -= drop;
        points.push({ x: curX, y: curY });

        if (curY <= drainTopElev + 0.01) break;

        // 马道段
        curX += (g.step_width || 0);
        points.push({ x: curX, y: curY });
      }
    } else {
      points.push({ x: drainInnerX, y: drainTopElev });
    }
    return points;
  }

  /**
   * 将世界坐标（实际距离，单位：米）转换为画布坐标（像素）
   *
   * @param {number} wx - 世界坐标 X（轴距，m）
   * @param {number} wy - 世界坐标 Y（高程，m）
   * @returns {Object} 画布坐标 {x, y}（像素）
   */
  toCanvasCoord(wx, wy) {
    return {
      // X 坐标：直接应用缩放和偏移
      x: this.transform.x + wx * this.transform.scale,
      // Y 坐标：注意 Y 轴方向（画布 Y 轴向下，高程向上）
      // 以坝底高程为基准，向上为正方向
      y: this.transform.y - (wy - this.globalConfig.dam_bottom_elevation) * this.transform.scale
    };
  }

  /**
   * 计算点到线段的距离
   *
   * @param {number} px - 点的 X 坐标
   * @param {number} py - 点的 Y 坐标
   * @param {number} x1 - 线段起点 X 坐标
   * @param {number} y1 - 线段起点 Y 坐标
   * @param {number} x2 - 线段终点 X 坐标
   * @param {number} y2 - 线段终点 Y 坐标
   * @returns {number} 点到线段的最短距离
   */
  pointToLineDistance(px, py, x1, y1, x2, y2) {
    const A = px - x1;
    const B = py - y1;
    const C = x2 - x1;
    const D = y2 - y1;

    const dot = A * C + B * D;
    const lenSq = C * C + D * D;
    let param = -1;

    if (lenSq !== 0) {
      param = dot / lenSq;
    }

    let xx, yy;

    if (param < 0) {
      xx = x1;
      yy = y1;
    } else if (param > 1) {
      xx = x2;
      yy = y2;
    } else {
      xx = x1 + param * C;
      yy = y1 + param * D;
    }

    const dx = px - xx;
    const dy = py - yy;
    return Math.sqrt(dx * dx + dy * dy);
  }

  /**
   * 计算两条线段的交点
   * 线段1: (x1, y1) - (x2, y2)
   * 线段2: (x3, y3) - (x4, y4)
   *
   * @returns {Object|null} 交点 {x, y}，如果没有交点（平行或不相交）则返回 null
   */
  getIntersection(x1, y1, x2, y2, x3, y3, x4, y4) {
    const denom = (x4 - x3) * (y1 - y2) - (x1 - x2) * (y4 - y3);
    if (denom === 0) return null;
    const intersectX = ((x1 * y2 - y1 * x2) * (x3 - x4) - (x1 - x2) * (x3 * y4 - y3 * x4)) / denom;
    const intersectY = ((x1 * y2 - y1 * x2) * (y3 - y4) - (y1 - y2) * (x3 * y4 - y3 * x4)) / denom;

    // 检查交点是否在两条线段的范围内
    const within1 =
      intersectX >= Math.min(x1, x2) - 0.01 &&
      intersectX <= Math.max(x1, x2) + 0.01 &&
      intersectY >= Math.min(y1, y2) - 0.01 &&
      intersectY <= Math.max(y1, y2) + 0.01;
    const within2 =
      intersectX >= Math.min(x3, x4) - 0.01 &&
      intersectX <= Math.max(x3, x4) + 0.01 &&
      intersectY >= Math.min(y3, y4) - 0.01 &&
      intersectY <= Math.max(y3, y4) + 0.01;

    if (within1 && within2) {
      return { x: intersectX, y: intersectY };
    }
    return null;
  }

  /**
   * 计算理论浸润线
   * 根据坝体类型（均质土坝或心墙坝）使用不同的理论模型计算浸润线
   *
   * @param {number} curLvl - 当前库水位 (m)
   * @param {Object} g - 全局配置对象
   * @returns {Array<Object>} 浸润线路径点数组 [{x, y}, ...]
   */
  calculateTheoryLine(curLvl, g) {
    // 如果没有数据，直接返回
    if (!this.apiTheoreticalLine) return [];

    // 如果数据本身就是数组且第一个元素有 x 属性，说明是 [{x, y}, ...] 格式
    if (Array.isArray(this.apiTheoreticalLine)) {
      if (this.apiTheoreticalLine.length > 0 && typeof this.apiTheoreticalLine[0] === 'object' && 'x' in this.apiTheoreticalLine[0]) {
        return this.apiTheoreticalLine;
      }
      return [];
    }

    // 如果数据是 { x: [], y: [] } 格式
    if (this.apiTheoreticalLine.x && Array.isArray(this.apiTheoreticalLine.x) && this.apiTheoreticalLine.x.length > 0) {
      let xyArr = [];
      this.apiTheoreticalLine.x.forEach((item, index) => {
        let obj = {};
        obj.x = item;
        obj.y = this.apiTheoreticalLine.y[index];
        xyArr.push(obj);
      });
      return xyArr;
    }

    return [];
  }

  /**
   * 计算警戒浸润线
   *
   * @returns {Array<Object>} 浸润线路径点数组 [{x, y}, ...]
   */
  calculateWarningLine() {
    // 如果没有数据，直接返回
    if (!this.apiWarningLine) return [];

    // 如果数据本身就是数组且第一个元素有 x 属性，说明是 [{x, y}, ...] 格式
    if (Array.isArray(this.apiWarningLine)) {
      if (this.apiWarningLine.length > 0 && typeof this.apiWarningLine[0] === 'object' && 'x' in this.apiWarningLine[0]) {
        return this.apiWarningLine;
      }
      return [];
    }

    // 如果数据是 { x: [], y: [] } 格式
    if (this.apiWarningLine.x && Array.isArray(this.apiWarningLine.x) && this.apiWarningLine.x.length > 0) {
      let xyArr = [];
      this.apiWarningLine.x.forEach((item, index) => {
        let obj = {};
        obj.x = item;
        obj.y = this.apiWarningLine.y[index];
        xyArr.push(obj);
      });
      return xyArr;
    }

    return [];
  }

  /**
   * 检测鼠标是否悬停在测压管上，并更新提示框显示
   * 优化：检测整个测压管线，而不仅仅是水位点，扩大检测范围
   *
   * @param {number} mx - 鼠标在画布中的 X 坐标（像素）
   * @param {number} my - 鼠标在画布中的 Y 坐标（像素）
   */
  checkHover(mx, my) {
    // 检查必要的数据是否存在
    if (!this.sections || !this.globalConfig || !this.tooltip) return;

    const s = this.sections.find((x) => x.id === this.currentSectionId);
    if (!s || !s.sensors || s.sensors.length === 0) {
      // 如果没有找到断面或没有传感器数据，隐藏提示框
      if (this.hoveredSensor) {
        this.hoveredSensor = null;
        if (this.tooltip) {
          this.tooltip.style.display = "none";
        }
        this.container.style.cursor = "grab";
      }
      return;
    }

    const g = this.globalConfig;
    let found = null;
    let minDistance = Infinity;

    // 根据缩放比例动态调整检测范围（缩放越大，检测范围可以稍小）
    const hoverThreshold = Math.max(20, 30 / Math.max(0.1, this.transform.scale));

    // 遍历所有测压管，检查鼠标是否在测压管附近
    s.sensors.forEach((sen) => {
      // 获取测压管位置处的大坝表面高程
      const surfY = this.getDamSurfaceY(sen.x, g);
      if (surfY === null) return; // 如果不在大坝范围内，跳过

      // 计算测压管底部和顶部的画布坐标
      const b = this.toCanvasCoord(sen.x, sen.bottom); // 底部
      const t = this.toCanvasCoord(sen.x, surfY); // 顶部（大坝表面）

      // 计算鼠标到测压管线的距离（从底部到表面）
      const distance = this.pointToLineDistance(mx, my, b.x, b.y, t.x, t.y);

      // 如果距离在阈值内，且是最近的，则选中该测压管
      if (distance < hoverThreshold && distance < minDistance) {
        minDistance = distance;
        found = sen;
      }
    });

    // 如果悬停的测压管发生变化，更新提示框和鼠标样式
    const hoverChanged = found !== this.hoveredSensor;

    if (hoverChanged) {
      this.hoveredSensor = found;

      // 更新鼠标样式
      if (found) {
        this.container.style.cursor = "pointer"; // 悬停时显示为指针
      } else {
        this.container.style.cursor = "grab"; // 未悬停时显示为抓取手
      }
    }

    // 如果悬停的测压管存在，更新提示框位置（保持与测压管线的固定距离）
    if (found) {
      // 显示提示框
      this.tooltip.style.display = "block";

      // 获取测压管位置处的大坝表面高程
      const surfY = this.getDamSurfaceY(found.x, g);
      const b = this.toCanvasCoord(found.x, found.bottom); // 底部
      const t = this.toCanvasCoord(found.x, surfY); // 顶部

      // 计算鼠标到测压管线的最近点
      const A = mx - b.x;
      const B = my - b.y;
      const C = t.x - b.x;
      const D = t.y - b.y;
      const dot = A * C + B * D;
      const lenSq = C * C + D * D;
      let param = lenSq !== 0 ? Math.max(0, Math.min(1, dot / lenSq)) : 0;

      // 测压管线上离鼠标最近的点
      const nearestX = b.x + param * C;
      const nearestY = b.y + param * D;

      // 固定偏移距离（像素）
      const fixedOffsetX = 40; // 水平固定距离
      const fixedOffsetY = 40; // 垂直固定距离

      // 计算提示框的初始位置（基于测压管线上的最近点，而不是鼠标位置）
      let tooltipX = nearestX + fixedOffsetX;
      let tooltipY = nearestY - fixedOffsetY; // 向上偏移，避免遮挡测压管

      const tooltipWidth = 150; // 估算提示框宽度
      const tooltipHeight = 90; // 估算提示框高度

      // 如果超出右边界，显示在左侧
      if (tooltipX + tooltipWidth > this.canvas.width) {
        tooltipX = nearestX - tooltipWidth - fixedOffsetX;
      }

      // 如果超出左边界，显示在右侧
      if (tooltipX < 0) {
        tooltipX = nearestX + fixedOffsetX;
      }

      // 如果超出下边界，显示在上方
      if (tooltipY + tooltipHeight > this.canvas.height) {
        tooltipY = nearestY - tooltipHeight - fixedOffsetY;
      }

      // 如果超出上边界，显示在下方
      if (tooltipY < 0) {
        tooltipY = nearestY + fixedOffsetY;
      }

      this.tooltip.style.left = tooltipX + "px";
      this.tooltip.style.top = tooltipY + "px";
      this.tooltip.innerHTML = `
                    <strong>${found.id}</strong><br>
                    轴距: ${found.x.toFixed(2)}m<br>
                    底高程: ${found.bottom.toFixed(2)}m<br>
                    水位: ${found.water.toFixed(2)}m
                `;
    } else {
      // 隐藏提示框
      this.tooltip.style.display = "none";
    }

    // 如果悬停状态发生变化，重新绘制以更新测压管高亮状态
    if (hoverChanged) {
      this.updateAndDraw();
    }
  }

  /**
   * 重置视图 - 自动调整缩放和位置，使整个大坝完整显示在画布中
   * 库水位区域只显示到20米位置（虽然绘制到80米，但视图只显示到20米）
   * @param {boolean} shouldDraw - 是否立即重绘 (默认 true)
   */
  resetView(shouldDraw = true) {
    const g = this.globalConfig;
    const h = g.dam_top_elevation - g.dam_bottom_elevation; // 大坝高度
    const bLX = -g.dam_top_width / 2 - h * g.upstream_slope; // 坝底左边界（上游坡脚）
    const bRX = g.dam_top_width / 2 + h * g.downstream_slope; // 坝底右边界（下游坡脚）

    // 视图边界优化：参考图片效果，减少多余空白
    const viewLeftX = bLX - 5; // 库水位侧留白
    const viewRightX = bRX - 0; // 下游侧留白
    const viewWidth = viewRightX - viewLeftX;
    const viewHeight = h + 5; // 大坝高度方向留白

    // 计算合适的缩放比例
    const scaleByWidth = (this.canvas.width * 1.1) / viewWidth;
    const scaleByHeight = (this.canvas.height * 0.92) / viewHeight;
    // 取较小值确保完整显示
    const sc = Math.min(scaleByWidth, scaleByHeight);

    // 计算视图中心点（世界坐标）
    const viewCenterX = (viewLeftX + viewRightX) / 2;
    // 垂直中心稍微下移（0.4），让坝体在视觉上更靠上，留出标注空间
    const viewCenterY = g.dam_bottom_elevation + h * 0.5;

    // 设置视图参数
    this.transform = {
      x: this.canvas.width / 2 - viewCenterX * sc,
      y: this.canvas.height * 0.5 + (viewCenterY - g.dam_bottom_elevation) * sc,
      scale: sc
    };

    if (shouldDraw) {
      this.updateAndDraw();
    }
  }

  // ========== 绘制引擎 ==========

  /**
   * 更新并绘制整个大坝剖面图
   * 绘制顺序：
   * 1. 外部库水体
   * 2. 大坝主体
   * 3. 防渗心墙（如果启用）
   * 4. 排水棱体（如果启用）
   * 5. 饱和区与实测浸润线
   * 5.5. 理论浸润线
   * 6. 测压管
   * 7. 坝轴线
   */
  updateAndDraw() {
    // 获取当前断面和全局配置
    const s = this.sections.find((x) => x.id === this.currentSectionId);
    const g = this.globalConfig;

    // 确定当前使用的库水位（优先使用断面本地水位）
    const curLvl = s.localLevel !== null && !isNaN(s.localLevel) ? s.localLevel : g.reservoir_water_level;

    // 清空画布
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    // 计算大坝关键点坐标
    const h = g.dam_top_elevation - g.dam_bottom_elevation; // 大坝高度
    const tLX = -g.dam_top_width / 2; // 坝顶左边界
    const tRX = g.dam_top_width / 2; // 坝顶右边界
    const bLX = tLX - h * g.upstream_slope; // 坝底左边界（上游坡脚）
    const bRX = tRX + h * g.downstream_slope; // 坝底右边界（下游坡脚）

    // ========== 1. 绘制外部库水体 ==========
    // 计算库水位与上游坡的交点
    const waterContactX = bLX + (curLvl - g.dam_bottom_elevation) * g.upstream_slope;

    // 动态计算水体左侧延伸距离 (大坝总宽的 10%)
    const damTotalWidth = bRX - bLX;
    const extX = bLX - damTotalWidth * 0.1;

    this.ctx.beginPath();
    const wBottomLeft = this.toCanvasCoord(extX, g.dam_bottom_elevation);
    const wToe = this.toCanvasCoord(bLX, g.dam_bottom_elevation); // 上游坡脚
    const wSurfaceContact = this.toCanvasCoord(waterContactX, curLvl); // 水位与坡面交点
    const wSurfaceLeft = this.toCanvasCoord(extX, curLvl); // 水位左边界

    this.ctx.moveTo(wBottomLeft.x, wBottomLeft.y);
    this.ctx.lineTo(wToe.x, wToe.y);
    this.ctx.lineTo(wSurfaceContact.x, wSurfaceContact.y);
    this.ctx.lineTo(wSurfaceLeft.x, wSurfaceLeft.y);
    this.ctx.closePath();

    this.ctx.fillStyle = "rgba(29, 78, 216, 0.7)"; // 参考 PLine2.html
    this.ctx.fill();

    // 绘制水位数值标注
    this.ctx.fillStyle = "#1d4ed8";
    this.ctx.font = "bold 13px sans-serif";
    this.ctx.textAlign = "right";
    this.ctx.fillText(`库水位: ${curLvl.toFixed(2)} m`, wSurfaceContact.x - 15, wSurfaceContact.y - 12);

    // ========== 2. 绘制大坝主体 ==========
    // 提前计算排水棱体几何（若启用），以便大坝主体能正确连接到棱体
    let drainInnerX = bRX;
    let drainTopElev = g.dam_bottom_elevation;

    if (g.prism_top_elevation > g.dam_bottom_elevation) {
      drainTopElev = g.prism_top_elevation;
      const hDrain = drainTopElev - g.dam_bottom_elevation;
      // 棱体内侧顶点 (与下游坡交点)
      drainInnerX = bRX - hDrain * g.downstream_slope;
    }

    this.ctx.beginPath();
    const p1 = this.toCanvasCoord(bLX, g.dam_bottom_elevation); // 上游坡脚
    const p2 = this.toCanvasCoord(tLX, g.dam_top_elevation); // 坝顶左端
    const p3 = this.toCanvasCoord(tRX, g.dam_top_elevation); // 坝顶右端

    this.ctx.moveTo(p1.x, p1.y);
    this.ctx.lineTo(p2.x, p2.y);
    this.ctx.lineTo(p3.x, p3.y);

    // 下游坡绘制 (含台阶逻辑)
    if (g.step_height > 0) {
      const drainTopElev = g.prism_top_elevation || g.dam_bottom_elevation;
      const H_slope = g.dam_top_elevation - drainTopElev;
      const L_total = H_slope * g.downstream_slope;
      const stepCount = Math.floor((H_slope - 0.01) / g.step_height);
      const totalBermWidth = stepCount * (g.step_width || 0);

      let effectiveM2 = g.downstream_slope;
      if (H_slope > 0) {
        effectiveM2 = Math.max(0, (L_total - totalBermWidth) / H_slope);
      }

      let curX = tRX, curY = g.dam_top_elevation;
      while (curY > drainTopElev) {
        // 坡段
        const drop = Math.min(g.step_height, curY - drainTopElev);
        const run = drop * effectiveM2;
        curX += run;
        curY -= drop;
        const pSlope = this.toCanvasCoord(curX, curY);
        this.ctx.lineTo(pSlope.x, pSlope.y);

        if (curY <= drainTopElev + 0.01) break;

        // 马道段
        curX += (g.step_width || 0);
        const pBerm = this.toCanvasCoord(curX, curY);
        this.ctx.lineTo(pBerm.x, pBerm.y);
      }

      // 完成到坝底或排水体的连接
      if (g.prism_top_elevation > g.dam_bottom_elevation) {
        // 使用内坡比计算底部连接点
        const hDrain = g.prism_top_elevation - g.dam_bottom_elevation;
        const innerSlope = g.prism_inner_slope || 0;
        const dInnerBotX = drainInnerX - hDrain * innerSlope;

        const pDrainBot = this.toCanvasCoord(dInnerBotX, g.dam_bottom_elevation);
        this.ctx.lineTo(pDrainBot.x, pDrainBot.y);
      } else {
        const p4 = this.toCanvasCoord(bRX, g.dam_bottom_elevation);
        this.ctx.lineTo(p4.x, p4.y);
      }
    } else {
      if (g.prism_top_elevation > g.dam_bottom_elevation) {
        const pDrainTop = this.toCanvasCoord(drainInnerX, drainTopElev);

        // 使用内坡比计算底部连接点
        const hDrain = g.prism_top_elevation - g.dam_bottom_elevation;
        const innerSlope = g.prism_inner_slope || 0;
        const dInnerBotX = drainInnerX - hDrain * innerSlope;

        const pDrainBot = this.toCanvasCoord(dInnerBotX, g.dam_bottom_elevation);
        this.ctx.lineTo(pDrainTop.x, pDrainTop.y);
        this.ctx.lineTo(pDrainBot.x, pDrainBot.y);
      } else {
        const p4 = this.toCanvasCoord(bRX, g.dam_bottom_elevation); // 原下游坡脚
        this.ctx.lineTo(p4.x, p4.y);
      }
    }

    this.ctx.lineTo(p1.x, p1.y);
    this.ctx.closePath();

    this.ctx.strokeStyle = "#475569"; // 灰色边框
    this.ctx.lineWidth = 2.5;
    this.ctx.stroke();

    this.ctx.fillStyle = "#f8fafc"; // 大坝主体填充色
    this.ctx.globalCompositeOperation = "destination-over";
    this.ctx.fill();
    this.ctx.globalCompositeOperation = "source-over";

    // ========== 3. 绘制防渗心墙（如果启用）==========
    if (g.coreWallEnabled && g.core_top_elevation > g.dam_bottom_elevation) {
      const ctLX = -g.core_top_width / 2; // 心墙顶左边界
      const ctRX = g.core_top_width / 2; // 心墙顶右边界
      const cbLX = -g.core_bottom_width / 2; // 心墙底左边界
      const cbRX = g.core_bottom_width / 2; // 心墙底右边界

      this.ctx.beginPath();
      const cp1 = this.toCanvasCoord(cbLX, g.dam_bottom_elevation);
      const cp2 = this.toCanvasCoord(ctLX, g.core_top_elevation);
      const cp3 = this.toCanvasCoord(ctRX, g.core_top_elevation);
      const cp4 = this.toCanvasCoord(cbRX, g.dam_bottom_elevation);

      this.ctx.moveTo(cp1.x, cp1.y);
      this.ctx.lineTo(cp2.x, cp2.y);
      this.ctx.lineTo(cp3.x, cp3.y);
      this.ctx.lineTo(cp4.x, cp4.y);
      this.ctx.closePath();

      // 使用斜纹填充（模拟防渗材料）
      this.ctx.save();
      this.ctx.clip(); // 限制绘制区域在心墙范围内
      this.ctx.fillStyle = "rgba(148, 163, 184, 0.2)";
      this.ctx.fill();
      this.ctx.strokeStyle = "rgba(148, 163, 184, 0.5)";
      this.ctx.lineWidth = 1;

      // 绘制斜纹线
      for (let i = -2000; i < 2000; i += 8) {
        this.ctx.beginPath();
        this.ctx.moveTo(this.transform.x + i * this.transform.scale, 0);
        this.ctx.lineTo(this.transform.x + (i - 400) * this.transform.scale, this.canvas.height);
        this.ctx.stroke();
      }
      this.ctx.restore();

      // 绘制心墙边界线（虚线）
      this.ctx.strokeStyle = "#94a3b8";
      this.ctx.setLineDash([2, 2]);
      this.ctx.stroke();
      this.ctx.setLineDash([]);
    }

    // ========== 4. 绘制排水棱体（如果启用）==========
    if (g.prism_top_elevation > g.dam_bottom_elevation) {
      const hDrain = g.prism_top_elevation - g.dam_bottom_elevation; // 排水体高度

      // 解析全局配置中的参数
      const width = g.prism_top_width || 4; // 棱体顶宽
      const slope = g.prism_slope || 1.5; // 外坡比
      const innerSlope = g.prism_inner_slope || 0; // 内坡比

      // PLine2.html 逻辑:
      // 内侧顶点X (与下游坡交点)
      const dInnerTopX = bRX - hDrain * g.downstream_slope;

      // 内侧底点：根据内坡比计算
      const dInnerBotX = dInnerTopX - hDrain * innerSlope;

      const dOuterTopX = dInnerTopX + width;
      const dOuterBotX = dOuterTopX + hDrain * slope;

      this.ctx.beginPath();
      // 顶点顺序: 内侧底 -> 内侧顶 -> 外侧顶 -> 外侧底
      const dp1 = this.toCanvasCoord(dInnerBotX, g.dam_bottom_elevation); // 内侧底
      const dp2 = this.toCanvasCoord(dInnerTopX, g.prism_top_elevation); // 内侧顶
      const dp3 = this.toCanvasCoord(dOuterTopX, g.prism_top_elevation); // 外侧顶
      const dp4 = this.toCanvasCoord(dOuterBotX, g.dam_bottom_elevation); // 外侧底

      this.ctx.moveTo(dp1.x, dp1.y);
      this.ctx.lineTo(dp2.x, dp2.y);
      this.ctx.lineTo(dp3.x, dp3.y);
      this.ctx.lineTo(dp4.x, dp4.y);
      this.ctx.closePath();

      this.ctx.fillStyle = "#64748b"; // 深灰色填充
      this.ctx.fill();
      this.ctx.strokeStyle = "#334155"; // 深色边框
      this.ctx.lineWidth = 1.5;
      this.ctx.stroke();
    }

    // ========== 5. 饱和区与浸润线 ==========
    // 按 X 坐标排序测压管
    const sensors = [...s.sensors].sort((a, b) => a.x - b.x);

    if (sensors.length > 0) {
      // 计算浸润线起点（库水位与坝体接触点）
      const inletX = Math.max(bLX, waterContactX);
      const inletY = Math.min(curLvl, this.getDamSurfaceY(inletX, g) || curLvl);

      // 构建浸润线路径点数组
      let linePath = [];
      linePath.push({ x: inletX, y: inletY }); // 起点

      // 遍历测压管，添加浸润线控制点
      sensors.forEach((sen, idx) => {
        const prev = idx === 0 ? { x: inletX, y: inletY } : sensors[idx - 1];

        // 如果路径跨越了心墙，需要插入中间控制点（模拟心墙的渗透阻力）
        if (g.coreWallEnabled) {
          const coreRange = this.getCoreRangeAtY(sen.water, g) || { left: -g.core_bottom_width / 2, right: g.core_bottom_width / 2 };

          // 检查是否从心墙左侧跨到了右侧
          if (prev.x < coreRange.left && sen.x > coreRange.right) {
            // 在心墙左右边界增加水位突降控制点（模拟渗透阻力）
            linePath.push({
              x: coreRange.left,
              y: prev.y - (prev.y - sen.water) * 0.1
            });
            linePath.push({
              x: coreRange.right,
              y: sen.water + (prev.y - sen.water) * 0.1
            });
          }
        }

        // 添加测压管位置点
        linePath.push({ x: sen.x, y: sen.water });
      });

      // 添加终点（排水体位置）
      // 添加终点（排水体位置）
      // 参考 PLine2.html:
      // ctx.lineTo(toCanvas(drainInnerX, g.drainTopElev).x, ...);

      let endX = bRX;
      let endY = g.dam_bottom_elevation;

      if (g.prism_top_elevation > g.dam_bottom_elevation) {
        // 如果有排水体，浸润线延伸到排水体内侧底点
        const hDrain = g.prism_top_elevation - g.dam_bottom_elevation;
        const innerSlope = g.prism_inner_slope || 0;
        // endX = bRX - hDrain * g.downstream_slope; // innerTopX
        // endX should be innerBotX
        endX = (bRX - hDrain * g.downstream_slope) - hDrain * innerSlope;
        endY = g.dam_bottom_elevation;
      }

      linePath.push({ x: endX, y: endY });

      // 填充饱和区（浸润线以下的区域）
      if (this.showActualPhreaticLine) {
        this.ctx.beginPath();
        const startCoord = this.toCanvasCoord(linePath[0].x, linePath[0].y);
        this.ctx.moveTo(startCoord.x, startCoord.y);

        linePath.forEach((pt) => {
          const cp = this.toCanvasCoord(pt.x, pt.y);
          this.ctx.lineTo(cp.x, cp.y);
        });

        // 连接到下方以形成封闭区域
        const cpEnd = this.toCanvasCoord(endX, g.dam_bottom_elevation);
        this.ctx.lineTo(cpEnd.x, cpEnd.y);

        // 如果有排水体，还要连接到坝底内侧点?
        // PLine2.html 逻辑:
        // ctx.lineTo(toCanvas(drainInnerX, g.drainTopElev).x, ...);
        // ctx.lineTo(toCanvas(drainInnerX, g.bottomElev).x, ...);
        // ctx.lineTo(toCanvas(waterOnDamX, g.bottomElev).x, ...);

        this.ctx.lineTo(p1.x, p1.y); // 连接到上游坡脚
        this.ctx.fillStyle = "rgba(6, 182, 212, 0.3)"; // 青色半透明
        this.ctx.fill();

        // 绘制浸润线（虚线）
        this.ctx.beginPath();
        this.ctx.setLineDash([6, 4]); // 虚线样式
        this.ctx.strokeStyle = this.actualPhreaticLineColor;
        this.ctx.lineWidth = 2.5;
        this.ctx.moveTo(startCoord.x, startCoord.y);

        linePath.forEach((pt) => {
          const cp = this.toCanvasCoord(pt.x, pt.y);
          this.ctx.lineTo(cp.x, cp.y);
        });

        this.ctx.stroke();
        this.ctx.setLineDash([]); // 恢复实线
      }
    }

    // ========== 5.5. 绘制理论浸润线 ==========
    // 计算并绘制理论浸润线（橙色实线）
    const theoryPoints = this.calculateTheoryLine(curLvl, g);
    console.log("理论浸润线--theoryPoints", theoryPoints);

    if (this.showTheoreticalLine && theoryPoints.length > 0) {
      let drawPoints = [...theoryPoints];
      // 如果不是粘土均质坝，且配置了排水体，则进行截断并连接到底部处理
      if (g.material_type !== 'clay' && g.prism_top_elevation > g.dam_bottom_elevation) {
        const drainTopElev = g.prism_top_elevation;
        const hDrain = g.prism_top_elevation - g.dam_bottom_elevation;
        const drainInnerX = bRX - hDrain * g.downstream_slope; // 排水体内侧顶点的 X

        // 获取下游坡所有关键点（含台阶）用于碰撞检测
        const slopePoints = this.getDownstreamSlopePoints(g, tRX, drainInnerX, drainTopElev);

        let intersected = false;
        let resultPoints = [];
        for (let i = 0; i < drawPoints.length; i++) {
          const p = drawPoints[i];
          if (i > 0) {
            const prev = drawPoints[i - 1];
            // 检测当前浸润线线段与下游坡任何一段是否相交
            for (let j = 1; j < slopePoints.length; j++) {
              const s1 = slopePoints[j - 1];
              const s2 = slopePoints[j];
              const inter = this.getIntersection(prev.x, prev.y, p.x, p.y, s1.x, s1.y, s2.x, s2.y);
              if (inter) {
                resultPoints.push(inter);
                intersected = true;
                break;
              }
            }
            if (intersected) break;
          }
          if (p.x >= drainInnerX) break;
          resultPoints.push(p);
        }

        if (intersected) {
          drawPoints = resultPoints;
        } else {
          // Check for intersection with the prism's inner slope
          // Inner Slope Line: (drainInnerX, drainTopElev) -> (dInnerBotX, g.dam_bottom_elevation)
          const innerSlope = g.prism_inner_slope || 0;
          const dInnerBotX = drainInnerX - hDrain * innerSlope;

          // Filter points that are beyond the inner bottom toe
          drawPoints = drawPoints.filter(p => p.x < dInnerBotX);
          drawPoints.push({ x: dInnerBotX, y: g.dam_bottom_elevation });
        }
      }

      this.ctx.beginPath();
      this.ctx.strokeStyle = this.theoreticalLineColor;
      this.ctx.lineWidth = 2;

      drawPoints.forEach((p, i) => {
        const cp = this.toCanvasCoord(p.x, p.y);
        if (i === 0) {
          this.ctx.moveTo(cp.x, cp.y);
        } else {
          this.ctx.lineTo(cp.x, cp.y);
        }
      });

      this.ctx.stroke();
    }



    // ========== 5.6. 绘制历史浸润线 ==========
    if (this.showHistoricalLine && this.apiHistoricalLine && this.apiHistoricalLine.length > 0) {
      this.ctx.beginPath();
      this.ctx.strokeStyle = this.historicalLineColor;
      this.ctx.lineWidth = 2;
      // 虚线
      this.ctx.setLineDash([5, 5]);

      this.apiHistoricalLine.forEach((p, i) => {
        const cp = this.toCanvasCoord(p.x, p.y);
        if (i === 0) {
          this.ctx.moveTo(cp.x, cp.y);
        } else {
          this.ctx.lineTo(cp.x, cp.y);
        }
      });

      this.ctx.stroke();
      this.ctx.setLineDash([]); // 恢复实线
    }

    // ========== 6. 绘制测压管 ==========
    sensors.forEach((sen) => {
      // 获取测压管位置处的大坝表面高程
      const surfY = this.getDamSurfaceY(sen.x, g);
      if (surfY === null) return; // 如果不在大坝范围内，跳过

      // 计算测压管底部和顶部的画布坐标
      const b = this.toCanvasCoord(sen.x, sen.bottom); // 底部
      const t = this.toCanvasCoord(sen.x, surfY); // 顶部（大坝表面）
      const isH = this.hoveredSensor === sen; // 是否悬停

      // 如果悬停，绘制一个半透明的悬浮区域指示（增强视觉反馈）
      if (isH) {
        const hoverWidth = 30; // 悬浮区域宽度（像素）
        this.ctx.beginPath();
        this.ctx.rect(b.x - hoverWidth / 2, Math.min(b.y, t.y), hoverWidth, Math.abs(t.y - b.y));
        this.ctx.fillStyle = "rgba(37, 99, 235, 0.15)"; // 浅蓝色半透明背景
        this.ctx.fill();
      }

      // 绘制测压管外管（从底部到表面）
      this.ctx.beginPath();
      this.ctx.strokeStyle = isH ? "#2563eb" : "#94a3b8"; // 悬停时高亮为蓝色
      this.ctx.lineWidth = isH ? 3 : 1.5; // 悬停时加粗
      this.ctx.moveTo(b.x, b.y);
      this.ctx.lineTo(t.x, t.y);
      this.ctx.stroke();

      // 绘制测压管水位线（从底部到水位）
      const swY = Math.min(sen.water, surfY); // 水位不能超过表面
      const sw = this.toCanvasCoord(sen.x, swY);

      this.ctx.beginPath();
      // 如果水位超过表面，显示为红色（异常状态）
      this.ctx.strokeStyle = sen.water > surfY ? "#ef4444" : isH ? "#1e90ff" : "#2563eb";
      this.ctx.lineWidth = isH ? 6 : 3; // 悬停时加粗
      this.ctx.moveTo(b.x, b.y);
      this.ctx.lineTo(sw.x, sw.y);
      this.ctx.stroke();

      // 绘制测压管底部标记点
      this.ctx.beginPath();
      this.ctx.fillStyle = isH ? "#2563eb" : "#1e293b";
      const pointRadius = isH ? 6 : 3.5; // 悬停时增大标记点
      this.ctx.arc(b.x, b.y, pointRadius, 0, Math.PI * 2);
      this.ctx.fill();

      // 绘制标记点外圈（悬停时更明显）
      if (isH) {
        this.ctx.beginPath();
        this.ctx.strokeStyle = "#2563eb";
        this.ctx.lineWidth = 2;
        this.ctx.arc(b.x, b.y, pointRadius + 3, 0, Math.PI * 2);
        this.ctx.stroke();
      }

      // 如果缩放比例足够大，显示测压管编号
      if (this.transform.scale > 0.4) {
        this.ctx.fillStyle = isH ? "#30dcff" : "#ffffff";
        this.ctx.font = isH ? "bold 12px sans-serif" : "11px sans-serif"; // 悬停时加粗字体
        this.ctx.textAlign = "center";
        this.ctx.fillText(sen.id, b.x, b.y + (isH ? 20 : 16));
      }
    });

    // ========== 6.5. 绘制警戒浸润线 (最后绘制，确保在最上层) ==========
    // 计算并绘制警戒浸润线（橙色实线）
    const warningPoints = this.calculateWarningLine();
    console.log("警戒浸润线--warningPoints", warningPoints);

    if (this.showWarningLine && warningPoints.length > 0) {
      let drawPoints = [...warningPoints];
      // 如果不是粘土均质坝，且配置了排水体，则进行截断并连接到底部处理
      if (g.material_type !== 'clay' && g.prism_top_elevation > g.dam_bottom_elevation) {
        const drainTopElev = g.prism_top_elevation;
        const hDrain = g.prism_top_elevation - g.dam_bottom_elevation;
        const drainInnerX = bRX - hDrain * g.downstream_slope; // 排水体内侧顶点的 X

        // 获取下游坡所有关键点（含台阶）用于碰撞检测
        const slopePoints = this.getDownstreamSlopePoints(g, tRX, drainInnerX, drainTopElev);

        let intersected = false;
        let resultPoints = [];
        for (let i = 0; i < drawPoints.length; i++) {
          const p = drawPoints[i];
          if (i > 0) {
            const prev = drawPoints[i - 1];
            // 检测当前浸润线线段与下游坡任何一段是否相交
            for (let j = 1; j < slopePoints.length; j++) {
              const s1 = slopePoints[j - 1];
              const s2 = slopePoints[j];
              const inter = this.getIntersection(prev.x, prev.y, p.x, p.y, s1.x, s1.y, s2.x, s2.y);
              if (inter) {
                resultPoints.push(inter);
                intersected = true;
                break;
              }
            }
            if (intersected) break;
          }
          if (p.x >= drainInnerX) break;
          resultPoints.push(p);
        }

        if (intersected) {
          drawPoints = resultPoints;
        } else {
          const innerSlope = g.prism_inner_slope || 0;
          const dInnerBotX = drainInnerX - hDrain * innerSlope;
          drawPoints = drawPoints.filter(p => p.x < dInnerBotX);
          drawPoints.push({ x: dInnerBotX, y: g.dam_bottom_elevation });
        }
      }

      this.ctx.beginPath();
      // 实线
      this.ctx.setLineDash([]);
      this.ctx.strokeStyle = this.warningLineColor;
      this.ctx.lineWidth = 2; // 警戒浸润线线宽加粗

      drawPoints.forEach((p, i) => {
        const cp = this.toCanvasCoord(p.x, p.y);
        if (i === 0) {
          this.ctx.moveTo(cp.x, cp.y);
        } else {
          this.ctx.lineTo(cp.x, cp.y);
        }
      });

      this.ctx.stroke();
      this.ctx.setLineDash([]); // 恢复实线
    }

    // ========== 7. 绘制坝轴线（参考线）==========
    const axT = this.toCanvasCoord(0, g.dam_top_elevation + 5); // 轴线上端
    const axB = this.toCanvasCoord(0, g.dam_bottom_elevation - 5); // 轴线下端

    this.ctx.beginPath();
    this.ctx.strokeStyle = "#ef4444"; // 红色
    this.ctx.setLineDash([5, 5]); // 虚线
    this.ctx.lineWidth = 1;
    this.ctx.moveTo(axT.x, axT.y);
    this.ctx.lineTo(axB.x, axB.y);
    this.ctx.stroke();
    this.ctx.setLineDash([]); // 恢复实线
  }

  /**
   * 调整画布大小以匹配容器尺寸
   * 当窗口大小改变时调用
   * @param {boolean} shouldDraw - 是否立即重绘 (默认 true)
   */
  resizeCanvas(shouldDraw = true) {
    this.canvas.width = this.container.clientWidth;
    this.canvas.height = this.container.clientHeight;
    if (shouldDraw) {
      this.updateAndDraw();
    }
  }

  destroy() {
    this.removeEventListeners();
    this.isDragging = false;
    if (this.container) {
      this.container.style.cursor = "default";
    }
    if (this.tooltip) {
      this.tooltip.style.display = "none";
    }
  }
}

export default PlineClass;
