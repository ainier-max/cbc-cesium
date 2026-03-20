function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function round(value, digits = 2) {
  return Number(value.toFixed(digits));
}

function getGeometry(globalConfig) {
  const top = Number(globalConfig.dam_top_elevation) || 0;
  const bottom = Number(globalConfig.dam_bottom_elevation) || 0;
  const height = Math.max(1, top - bottom);
  const crestLeft = Math.max(1, (Number(globalConfig.upstream_slope) || 0) * height);
  const crestWidth = Math.max(1, Number(globalConfig.dam_top_width) || 1);
  const crestRight = crestLeft + crestWidth;
  const toeRight = crestRight + Math.max(1, (Number(globalConfig.downstream_slope) || 0) * height);
  const centerX = (crestLeft + crestRight) / 2;

  return {
    top,
    bottom,
    height,
    crestLeft,
    crestRight,
    toeRight,
    centerX,
    xMin: -8,
    xMax: toeRight + 12,
    yMin: Math.max(0, bottom - height * 0.2),
    yMax: top + height * 0.35
  };
}

function createViewport(geometry, canvasWidth, canvasHeight) {
  const paddingX = 52;
  const paddingY = 40;
  const worldWidth = Math.max(1, geometry.xMax - geometry.xMin);
  const worldHeight = Math.max(1, geometry.yMax - geometry.yMin);
  const scale = Math.min(
    (canvasWidth - paddingX * 2) / worldWidth,
    (canvasHeight - paddingY * 2) / worldHeight
  );

  return {
    scale,
    offsetX: paddingX - geometry.xMin * scale,
    offsetY: canvasHeight - paddingY + geometry.yMin * scale
  };
}

export function createStructuralScene({ canvas, container, tooltip, getGlobalConfig, getSections, getCurrentSectionId }) {
  const ctx = canvas.getContext("2d");
  const state = {
    scale: 1,
    offsetX: 0,
    offsetY: 0,
    isDragging: false,
    lastPointerX: 0,
    lastPointerY: 0,
    sensorHotspots: [],
    dpr: Math.max(window.devicePixelRatio || 1, 1)
  };

  function getSection() {
    const sections = getSections();
    const currentId = getCurrentSectionId();
    return sections.find((item) => item.id === currentId) || sections[0] || { name: "断面", sensors: [] };
  }

  function getWaterLevel(section, globalConfig) {
    if (section.localLevel === null || section.localLevel === undefined || section.localLevel === "") {
      return Number(globalConfig.reservoir_water_level) || 0;
    }
    return Number(section.localLevel) || 0;
  }

  function worldToScreen(x, y) {
    return {
      x: state.offsetX + x * state.scale,
      y: state.offsetY - y * state.scale
    };
  }

  function screenToWorld(x, y) {
    return {
      x: (x - state.offsetX) / state.scale,
      y: (state.offsetY - y) / state.scale
    };
  }

  function resizeCanvas() {
    const width = Math.max(container.clientWidth, 320);
    const height = Math.max(container.clientHeight, 320);
    state.dpr = Math.max(window.devicePixelRatio || 1, 1);
    canvas.width = Math.floor(width * state.dpr);
    canvas.height = Math.floor(height * state.dpr);
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
    ctx.setTransform(state.dpr, 0, 0, state.dpr, 0, 0);
    draw();
  }

  function resetView() {
    const geometry = getGeometry(getGlobalConfig());
    const viewport = createViewport(geometry, container.clientWidth, container.clientHeight);
    state.scale = viewport.scale;
    state.offsetX = viewport.offsetX;
    state.offsetY = viewport.offsetY;
    draw();
  }

  function drawGrid(geometry, width) {
    ctx.save();
    ctx.strokeStyle = "#dbeafe";
    ctx.lineWidth = 1;
    ctx.setLineDash([4, 4]);
    const startX = Math.floor(geometry.xMin / 10) * 10;
    const endX = Math.ceil(geometry.xMax / 10) * 10;
    const startY = Math.floor(geometry.yMin / 5) * 5;
    const endY = Math.ceil(geometry.yMax / 5) * 5;

    for (let x = startX; x <= endX; x += 10) {
      const p1 = worldToScreen(x, geometry.yMin);
      const p2 = worldToScreen(x, geometry.yMax);
      ctx.beginPath();
      ctx.moveTo(p1.x, p1.y);
      ctx.lineTo(p2.x, p2.y);
      ctx.stroke();
    }

    for (let y = startY; y <= endY; y += 5) {
      const p1 = worldToScreen(geometry.xMin, y);
      const p2 = worldToScreen(geometry.xMax, y);
      ctx.beginPath();
      ctx.moveTo(p1.x, p1.y);
      ctx.lineTo(p2.x, p2.y);
      ctx.stroke();
    }

    ctx.setLineDash([]);
    ctx.strokeStyle = "#94a3b8";
    ctx.fillStyle = "#475569";
    ctx.lineWidth = 1.2;
    const xAxisLeft = worldToScreen(geometry.xMin, geometry.bottom);
    const xAxisRight = worldToScreen(geometry.xMax, geometry.bottom);
    const yAxisTop = worldToScreen(0, geometry.yMax);
    const yAxisBottom = worldToScreen(0, geometry.yMin);

    ctx.beginPath();
    ctx.moveTo(xAxisLeft.x, xAxisLeft.y);
    ctx.lineTo(xAxisRight.x, xAxisRight.y);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(yAxisBottom.x, yAxisBottom.y);
    ctx.lineTo(yAxisTop.x, yAxisTop.y);
    ctx.stroke();

    ctx.font = "12px sans-serif";
    for (let x = startX; x <= endX; x += 10) {
      const point = worldToScreen(x, geometry.bottom);
      ctx.fillText(`${x}`, point.x - 8, point.y + 18);
    }
    for (let y = startY; y <= endY; y += 5) {
      const point = worldToScreen(0, y);
      ctx.fillText(`${y}`, point.x - 34, point.y + 4);
    }

    ctx.fillText("高程(m)", 16, 24);
    ctx.fillText("水平距离(m)", width - 88, xAxisRight.y - 12);
    ctx.restore();
  }

  function drawReservoir(geometry, waterLevel) {
    const clamped = clamp(waterLevel, geometry.bottom, geometry.top);
    if (clamped <= geometry.bottom) return;
    const intersectX = geometry.crestLeft - (geometry.top - clamped) * (Number(getGlobalConfig().upstream_slope) || 0);
    const base = worldToScreen(0, geometry.bottom);
    const waterLeft = worldToScreen(0, clamped);
    const waterIntersect = worldToScreen(intersectX, clamped);

    ctx.save();
    ctx.beginPath();
    ctx.moveTo(base.x, base.y);
    ctx.lineTo(waterLeft.x, waterLeft.y);
    ctx.lineTo(waterIntersect.x, waterIntersect.y);
    ctx.closePath();
    ctx.fillStyle = "rgba(59, 130, 246, 0.22)";
    ctx.fill();

    ctx.strokeStyle = "#2563eb";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(waterLeft.x, waterLeft.y);
    ctx.lineTo(waterIntersect.x, waterIntersect.y);
    ctx.stroke();
    ctx.fillStyle = "#1d4ed8";
    ctx.font = "12px sans-serif";
    ctx.fillText(`库水位 ${round(waterLevel, 1)}m`, waterIntersect.x - 88, waterIntersect.y - 10);
    ctx.restore();
  }

  function drawDamBody(geometry, globalConfig) {
    const points = [
      worldToScreen(0, geometry.bottom),
      worldToScreen(geometry.crestLeft, geometry.top),
      worldToScreen(geometry.crestRight, geometry.top),
      worldToScreen(geometry.toeRight, geometry.bottom)
    ];

    ctx.save();
    ctx.beginPath();
    ctx.moveTo(points[0].x, points[0].y);
    points.slice(1).forEach((point) => ctx.lineTo(point.x, point.y));
    ctx.closePath();

    const gradient = ctx.createLinearGradient(0, points[1].y, 0, points[0].y);
    gradient.addColorStop(0, "#caa26b");
    gradient.addColorStop(1, "#8b6b45");
    ctx.fillStyle = gradient;
    ctx.fill();

    ctx.strokeStyle = "#5b4631";
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.fillStyle = "#1f2937";
    ctx.font = "13px sans-serif";
    const crestMid = worldToScreen((geometry.crestLeft + geometry.crestRight) / 2, geometry.top);
    ctx.fillText("坝顶", crestMid.x - 14, crestMid.y - 10);

    if (globalConfig.material_type === "earth" && globalConfig.coreWallEnabled) {
      const coreTop = clamp(Number(globalConfig.core_top_elevation) || geometry.top, geometry.bottom, geometry.top);
      const coreTopHalf = Math.max(0.6, (Number(globalConfig.core_top_width) || 1) / 2);
      const coreBottomHalf = Math.max(coreTopHalf, (Number(globalConfig.core_bottom_width) || 2) / 2);
      const center = geometry.centerX;
      const corePoints = [
        worldToScreen(center - coreBottomHalf, geometry.bottom),
        worldToScreen(center - coreTopHalf, coreTop),
        worldToScreen(center + coreTopHalf, coreTop),
        worldToScreen(center + coreBottomHalf, geometry.bottom)
      ];
      ctx.beginPath();
      ctx.moveTo(corePoints[0].x, corePoints[0].y);
      corePoints.slice(1).forEach((point) => ctx.lineTo(point.x, point.y));
      ctx.closePath();
      ctx.fillStyle = "rgba(220, 38, 38, 0.35)";
      ctx.fill();
      ctx.strokeStyle = "#991b1b";
      ctx.lineWidth = 1.5;
      ctx.stroke();
    }

    const prismTop = clamp(Number(globalConfig.prism_top_elevation) || geometry.bottom, geometry.bottom, geometry.top);
    if (prismTop > geometry.bottom) {
      const rise = prismTop - geometry.bottom;
      const outerRun = rise * Math.max(0, Number(globalConfig.prism_slope) || 0);
      const innerRun = rise * Math.max(0, Number(globalConfig.prism_inner_slope) || 0);
      const topWidth = Math.max(0.8, Number(globalConfig.prism_top_width) || 1);
      const topRight = geometry.toeRight - outerRun;
      const topLeft = topRight - topWidth;
      const baseLeft = topLeft - innerRun;
      const prismPoints = [
        worldToScreen(baseLeft, geometry.bottom),
        worldToScreen(topLeft, prismTop),
        worldToScreen(topRight, prismTop),
        worldToScreen(geometry.toeRight, geometry.bottom)
      ];
      ctx.beginPath();
      ctx.moveTo(prismPoints[0].x, prismPoints[0].y);
      prismPoints.slice(1).forEach((point) => ctx.lineTo(point.x, point.y));
      ctx.closePath();
      ctx.fillStyle = "rgba(14, 165, 233, 0.3)";
      ctx.fill();
      ctx.strokeStyle = "#0369a1";
      ctx.lineWidth = 1.5;
      ctx.stroke();
    }

    if ((Number(globalConfig.step_height) || 0) > 0 && (Number(globalConfig.step_width) || 0) > 0) {
      const stepHeight = Number(globalConfig.step_height);
      const stepWidth = Number(globalConfig.step_width);
      ctx.strokeStyle = "rgba(71, 85, 105, 0.9)";
      ctx.setLineDash([6, 4]);
      for (let y = geometry.top - stepHeight; y > geometry.bottom; y -= stepHeight) {
        const slopeX = geometry.crestRight + (geometry.top - y) * (Number(globalConfig.downstream_slope) || 0);
        const p1 = worldToScreen(slopeX - stepWidth, y);
        const p2 = worldToScreen(slopeX, y);
        ctx.beginPath();
        ctx.moveTo(p1.x, p1.y);
        ctx.lineTo(p2.x, p2.y);
        ctx.stroke();
      }
      ctx.setLineDash([]);
    }

    ctx.restore();
  }

  function drawSensors(geometry, section) {
    state.sensorHotspots = [];
    const topY = geometry.top + geometry.height * 0.08;

    ctx.save();
    section.sensors.forEach((sensor) => {
      const x = Number(sensor.x) || 0;
      const bottom = Number(sensor.bottom) || geometry.bottom;
      const water = Number(sensor.water) || bottom;
      const topPoint = worldToScreen(x, topY);
      const bottomPoint = worldToScreen(x, bottom);
      const waterPoint = worldToScreen(x, water);

      ctx.strokeStyle = "#334155";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(topPoint.x, topPoint.y);
      ctx.lineTo(bottomPoint.x, bottomPoint.y);
      ctx.stroke();

      ctx.strokeStyle = "#0ea5e9";
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(waterPoint.x, waterPoint.y);
      ctx.lineTo(bottomPoint.x, bottomPoint.y);
      ctx.stroke();

      ctx.fillStyle = "#f8fafc";
      ctx.strokeStyle = "#0f172a";
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(topPoint.x, topPoint.y, 6, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = "#0f172a";
      ctx.font = "12px sans-serif";
      ctx.fillText(sensor.id || "P", topPoint.x + 8, topPoint.y + 4);

      state.sensorHotspots.push({
        sensor,
        x: topPoint.x,
        y: Math.min(topPoint.y, bottomPoint.y),
        width: 18,
        height: Math.abs(bottomPoint.y - topPoint.y) + 6
      });
    });
    ctx.restore();
  }

  function drawSummary(geometry, section, globalConfig) {
    const boxX = container.clientWidth - 230;
    const boxY = 18;
    const waterLevel = getWaterLevel(section, globalConfig);

    ctx.save();
    ctx.fillStyle = "rgba(15, 23, 42, 0.88)";
    ctx.fillRect(boxX, boxY, 212, 112);

    ctx.fillStyle = "#f8fafc";
    ctx.font = "bold 14px sans-serif";
    ctx.fillText(section.name || "当前断面", boxX + 14, boxY + 24);
    ctx.font = "12px sans-serif";
    ctx.fillText(`坝高: ${round(geometry.height, 1)} m`, boxX + 14, boxY + 48);
    ctx.fillText(`坝顶宽: ${round(globalConfig.dam_top_width, 1)} m`, boxX + 14, boxY + 68);
    ctx.fillText(`当前水位: ${round(waterLevel, 1)} m`, boxX + 14, boxY + 88);
    ctx.fillText(`测压管数: ${section.sensors.length}`, boxX + 14, boxY + 108);
    ctx.restore();
  }

  function draw() {
    const width = container.clientWidth;
    const height = container.clientHeight;
    if (!width || !height) return;

    ctx.clearRect(0, 0, width, height);
    ctx.fillStyle = "#dbeafe";
    ctx.fillRect(0, 0, width, height);

    const globalConfig = getGlobalConfig();
    const section = getSection();
    const geometry = getGeometry(globalConfig);
    const waterLevel = getWaterLevel(section, globalConfig);

    drawGrid(geometry, width);
    drawReservoir(geometry, waterLevel);
    drawDamBody(geometry, globalConfig);
    drawSensors(geometry, section);
    drawSummary(geometry, section, globalConfig);
  }

  function hideTooltip() {
    tooltip.style.display = "none";
  }

  function showTooltip(sensor, clientX, clientY) {
    tooltip.innerHTML = `
      <div><strong>${sensor.id}</strong></div>
      <div>X 距离: ${round(Number(sensor.x) || 0, 2)} m</div>
      <div>底部高程: ${round(Number(sensor.bottom) || 0, 2)} m</div>
      <div>测得水位: ${round(Number(sensor.water) || 0, 2)} m</div>
    `;
    tooltip.style.display = "block";
    tooltip.style.left = `${clientX + 16}px`;
    tooltip.style.top = `${clientY + 16}px`;
  }

  function findSensorHit(offsetX, offsetY) {
    return state.sensorHotspots.find((item) => {
      return offsetX >= item.x - item.width / 2 &&
        offsetX <= item.x + item.width / 2 &&
        offsetY >= item.y - 6 &&
        offsetY <= item.y + item.height;
    });
  }

  function onMouseDown(event) {
    state.isDragging = true;
    state.lastPointerX = event.offsetX;
    state.lastPointerY = event.offsetY;
    canvas.style.cursor = "grabbing";
  }

  function onMouseMove(event) {
    if (state.isDragging) {
      const dx = event.offsetX - state.lastPointerX;
      const dy = event.offsetY - state.lastPointerY;
      state.offsetX += dx;
      state.offsetY += dy;
      state.lastPointerX = event.offsetX;
      state.lastPointerY = event.offsetY;
      hideTooltip();
      draw();
      return;
    }

    const hit = findSensorHit(event.offsetX, event.offsetY);
    canvas.style.cursor = hit ? "pointer" : "grab";
    if (hit) {
      showTooltip(hit.sensor, event.offsetX, event.offsetY);
    } else {
      hideTooltip();
    }
  }

  function onMouseUp() {
    state.isDragging = false;
    canvas.style.cursor = "grab";
  }

  function onWheel(event) {
    event.preventDefault();
    const zoomFactor = event.deltaY < 0 ? 1.12 : 0.9;
    const nextScale = clamp(state.scale * zoomFactor, 2, 80);
    const pointerBefore = screenToWorld(event.offsetX, event.offsetY);
    state.scale = nextScale;
    state.offsetX = event.offsetX - pointerBefore.x * state.scale;
    state.offsetY = event.offsetY + pointerBefore.y * state.scale;
    hideTooltip();
    draw();
  }

  canvas.addEventListener("mousedown", onMouseDown);
  canvas.addEventListener("mousemove", onMouseMove);
  canvas.addEventListener("mouseup", onMouseUp);
  canvas.addEventListener("mouseleave", () => {
    state.isDragging = false;
    canvas.style.cursor = "grab";
    hideTooltip();
  });
  canvas.addEventListener("wheel", onWheel, { passive: false });

  return {
    draw,
    resizeCanvas,
    resetView,
    destroy() {
      canvas.removeEventListener("mousedown", onMouseDown);
      canvas.removeEventListener("mousemove", onMouseMove);
      canvas.removeEventListener("mouseup", onMouseUp);
      canvas.removeEventListener("wheel", onWheel);
      hideTooltip();
    }
  };
}
