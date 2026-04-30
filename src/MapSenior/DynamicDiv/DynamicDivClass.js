import * as Cesium from "cesium";

const WINDOW_ANCHOR = {
  x: 20,
  y: 7
};

const COLLISION_GAP = 8;
const ARROW_SIZE = 12;

export default class DynamicDivClass {
  constructor(viewer) {
    this.viewer = viewer;
    this.overlays = [];
    this.entities = [];
    this.preRender = null;
  }

  update(dataList) {
    if (!this.viewer || !this.viewer.container) return;

    const list = Array.isArray(dataList) ? dataList : [];
    if (!this.overlays.length) {
      this.createOverlays(list);
    }

    this.overlays.forEach((item) => {
      const info = list.find((data) => data.id === item.data.id) || item.data;
      item.data = {
        ...item.data,
        ...info
      };
      item.element.innerHTML = this.getInfoHtml(item.data);
      item.element.style.display = "block";
    });

    this.bindRender();
    this.render();
  }

  createOverlays(dataList) {
    const container = this.viewer.container;
    dataList.forEach((data) => {
      const element = document.createElement("div");
      element.id = `dynamic-div-${data.id}`;
      element.className = "dynamic-div-window";
      element.style.cssText = [
        "position:absolute",
        "left:0",
        "top:0",
        "z-index:20",
        "pointer-events:none",
        "transform:translate(-9999px,-9999px)",
        "will-change:transform"
      ].join(";");
      element.innerHTML = this.getInfoHtml(data);
      container.appendChild(element);

      const entity = this.viewer.entities.add({
        position: this.getCartesian(data),
        point: {
          pixelSize: 9,
          color: Cesium.Color.fromCssColorString(data.color || "#35d6ad"),
          outlineColor: Cesium.Color.WHITE,
          outlineWidth: 2,
          disableDepthTestDistance: Number.POSITIVE_INFINITY
        }
      });

      this.entities.push(entity);
      this.overlays.push({ data, element, entity });
    });
  }

  bindRender() {
    if (this.preRender) return;
    this.preRender = this.render.bind(this);
    this.viewer.scene.preRender.addEventListener(this.preRender);
  }

  render() {
    if (!this.viewer || !this.viewer.scene) return;

    const placedRects = [];
    this.overlays.forEach((item) => {
      const position = this.getCartesian(item.data);
      const canvasPosition = this.viewer.scene.cartesianToCanvasCoordinates(position);

      if (!Cesium.defined(canvasPosition)) {
        item.element.style.display = "none";
        return;
      }

      item.element.style.display = "block";
      const layout = this.getAvoidLayout(
        canvasPosition,
        item.element.offsetWidth,
        item.element.offsetHeight,
        placedRects
      );

      item.element.style.transform = `translate(${layout.left}px, ${layout.top}px)`;
      this.updateArrow(item.element, layout.arrow);
      placedRects.push(layout.rect);
    });
  }

  getCartesian(data) {
    return Cesium.Cartesian3.fromDegrees(data.lon, data.lat, data.height || 0);
  }

  getAvoidLayout(canvasPosition, width, height, placedRects) {
    const candidates = this.getLayoutCandidates(canvasPosition, width, height)
      .map((candidate, index) => {
        const rect = this.getRect(candidate.left, candidate.top, width, height);
        return {
          ...candidate,
          rect,
          index,
          collision: placedRects.some((placedRect) => this.isCollision(rect, placedRect)),
          overflow: this.getOverflow(rect)
        };
      });

    const noCollision = candidates.filter((candidate) => !candidate.collision);
    if (noCollision.length) {
      return noCollision.sort((a, b) => {
        if (a.overflow !== b.overflow) return a.overflow - b.overflow;
        return a.index - b.index;
      })[0];
    }

    return candidates.sort((a, b) => {
      const overlapDiff = this.getOverlapArea(a.rect, placedRects) - this.getOverlapArea(b.rect, placedRects);
      if (overlapDiff !== 0) return overlapDiff;
      if (a.overflow !== b.overflow) return a.overflow - b.overflow;
      return a.index - b.index;
    })[0];
  }

  getLayoutCandidates(canvasPosition, width, height) {
    const x = canvasPosition.x;
    const y = canvasPosition.y;
    const centerX = Math.round(width / 2);
    const centerY = Math.round(height / 2);

    return [
      {
        left: x - WINDOW_ANCHOR.x,
        top: y - height - WINDOW_ANCHOR.y,
        arrow: { left: "14px", bottom: "-7px" }
      },
      {
        left: x - width + WINDOW_ANCHOR.x,
        top: y - height - WINDOW_ANCHOR.y,
        arrow: { right: "14px", bottom: "-7px" }
      },
      {
        left: x - WINDOW_ANCHOR.x,
        top: y + WINDOW_ANCHOR.y,
        arrow: { left: "14px", top: "-7px" }
      },
      {
        left: x - width + WINDOW_ANCHOR.x,
        top: y + WINDOW_ANCHOR.y,
        arrow: { right: "14px", top: "-7px" }
      },
      {
        left: x - centerX,
        top: y - height - WINDOW_ANCHOR.y,
        arrow: { left: `${centerX - ARROW_SIZE / 2}px`, bottom: "-7px" }
      },
      {
        left: x - centerX,
        top: y + WINDOW_ANCHOR.y,
        arrow: { left: `${centerX - ARROW_SIZE / 2}px`, top: "-7px" }
      },
      {
        left: x + WINDOW_ANCHOR.y,
        top: y - centerY,
        arrow: { left: "-7px", top: `${centerY - ARROW_SIZE / 2}px` }
      },
      {
        left: x - width - WINDOW_ANCHOR.y,
        top: y - centerY,
        arrow: { right: "-7px", top: `${centerY - ARROW_SIZE / 2}px` }
      }
    ];
  }

  getRect(left, top, width, height) {
    return {
      left,
      top,
      right: left + width,
      bottom: top + height
    };
  }

  isCollision(rect, target) {
    return !(
      rect.right + COLLISION_GAP < target.left ||
      rect.left - COLLISION_GAP > target.right ||
      rect.bottom + COLLISION_GAP < target.top ||
      rect.top - COLLISION_GAP > target.bottom
    );
  }

  getOverflow(rect) {
    const container = this.viewer && this.viewer.container;
    if (!container) return 0;

    const width = container.clientWidth;
    const height = container.clientHeight;
    return Math.max(0, -rect.left) +
      Math.max(0, -rect.top) +
      Math.max(0, rect.right - width) +
      Math.max(0, rect.bottom - height);
  }

  getOverlapArea(rect, placedRects) {
    return placedRects.reduce((total, placedRect) => {
      const overlapWidth = Math.max(0, Math.min(rect.right, placedRect.right) - Math.max(rect.left, placedRect.left));
      const overlapHeight = Math.max(0, Math.min(rect.bottom, placedRect.bottom) - Math.max(rect.top, placedRect.top));
      return total + overlapWidth * overlapHeight;
    }, 0);
  }

  updateArrow(element, arrow) {
    const arrowElement = element.querySelector(".dynamic-div-arrow");
    if (!arrowElement) return;

    arrowElement.style.left = arrow.left || "auto";
    arrowElement.style.right = arrow.right || "auto";
    arrowElement.style.top = arrow.top || "auto";
    arrowElement.style.bottom = arrow.bottom || "auto";
  }

  getInfoHtml(data) {
    return `
      <div class="dynamic-div-card" style="
        position: relative;
        min-width: 156px;
        max-width: 220px;
        padding: 8px 12px 9px;
        color: #fff;
        font-size: 13px;
        line-height: 1.5;
        font-weight: 600;
        white-space: nowrap;
        background: linear-gradient(180deg, rgba(22, 87, 73, 0.94), rgba(12, 64, 58, 0.94));
        border: 1px solid rgba(80, 214, 170, 0.9);
        border-radius: 6px;
        box-shadow: 0 0 10px rgba(26, 156, 119, 0.42);
        text-shadow: 0 1px 2px rgba(0, 38, 32, 0.45);
      ">
        <div>${data.name || "-"}</div>
        <div>流量:${this.formatValue(data.flow)} m3/s</div>
        <div>水位:${this.formatValue(data.level)} m</div>
        <span class="dynamic-div-arrow" style="
          position:absolute;
          left:14px;
          bottom:-7px;
          width:12px;
          height:12px;
          background:#0c403a;
          border:1px solid rgba(80, 214, 170, 0.9);
          transform:rotate(45deg);
        "></span>
      </div>
    `;
  }

  formatValue(value) {
    if (value === undefined || value === null || value === "") return "-";
    return value;
  }

  destroy() {
    if (this.viewer && this.preRender) {
      this.viewer.scene.preRender.removeEventListener(this.preRender);
    }
    this.preRender = null;

    this.overlays.forEach((item) => {
      if (item.element && item.element.parentNode) {
        item.element.parentNode.removeChild(item.element);
      }
    });
    this.overlays = [];

    if (this.viewer) {
      this.entities.forEach((entity) => {
        this.viewer.entities.remove(entity);
      });
    }
    this.entities = [];
    this.viewer = null;
  }
}
