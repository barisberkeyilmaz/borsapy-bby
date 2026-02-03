import {
  ISeriesPrimitive,
  SeriesAttachedParameter,
  Time,
  ISeriesPrimitivePaneView,
  ISeriesPrimitivePaneRenderer,
  PrimitiveHoveredItem,
  SeriesMarker,
} from "lightweight-charts";

interface MarkerRendererData {
  x: number;
  y: number;
  color: string;
  shape: "arrowUp" | "arrowDown" | "circle" | "square";
  text?: string;
  position: "aboveBar" | "belowBar" | "inBar";
}

class MarkersPaneRenderer implements ISeriesPrimitivePaneRenderer {
  private _data: MarkerRendererData[] = [];

  setData(data: MarkerRendererData[]) {
    this._data = data;
  }

  draw(target: any): void {
    // lightweight-charts v5 uses CanvasRenderingTarget2D
    target.useBitmapCoordinateSpace((scope: any) => {
      const ctx = scope.context as CanvasRenderingContext2D;
      const horizontalPixelRatio = scope.horizontalPixelRatio;
      const verticalPixelRatio = scope.verticalPixelRatio;

      for (const marker of this._data) {
        const x = marker.x * horizontalPixelRatio;
        const y = marker.y * verticalPixelRatio;
        const { color, shape, text } = marker;

        ctx.save();
        ctx.fillStyle = color;
        ctx.strokeStyle = color;
        ctx.lineWidth = 2;

        const size = 10 * horizontalPixelRatio;

        if (shape === "arrowUp") {
          // Draw up arrow
          ctx.beginPath();
          ctx.moveTo(x, y);
          ctx.lineTo(x - size / 2, y + size);
          ctx.lineTo(x + size / 2, y + size);
          ctx.closePath();
          ctx.fill();
        } else if (shape === "arrowDown") {
          // Draw down arrow
          ctx.beginPath();
          ctx.moveTo(x, y);
          ctx.lineTo(x - size / 2, y - size);
          ctx.lineTo(x + size / 2, y - size);
          ctx.closePath();
          ctx.fill();
        } else if (shape === "circle") {
          ctx.beginPath();
          ctx.arc(x, y, size / 2, 0, Math.PI * 2);
          ctx.fill();
        } else if (shape === "square") {
          ctx.fillRect(x - size / 2, y - size / 2, size, size);
        }

        // Draw text label
        if (text) {
          const fontSize = 9 * horizontalPixelRatio;
          ctx.font = `bold ${fontSize}px sans-serif`;
          ctx.textAlign = "center";

          const textY = shape === "arrowUp"
            ? y + size + 10 * verticalPixelRatio
            : y - size - 4 * verticalPixelRatio;

          // Background for text
          const textWidth = ctx.measureText(text).width + 4 * horizontalPixelRatio;
          ctx.fillStyle = color;
          ctx.fillRect(
            x - textWidth / 2,
            textY - 8 * verticalPixelRatio,
            textWidth,
            10 * verticalPixelRatio
          );

          // Text
          ctx.fillStyle = "#ffffff";
          ctx.fillText(text, x, textY);
        }

        ctx.restore();
      }
    });
  }
}

class MarkersPaneView implements ISeriesPrimitivePaneView {
  private _renderer = new MarkersPaneRenderer();
  private _data: MarkerRendererData[] = [];

  setData(data: MarkerRendererData[]) {
    this._data = data;
    this._renderer.setData(data);
  }

  renderer(): ISeriesPrimitivePaneRenderer {
    return this._renderer;
  }

  zOrder(): "top" | "bottom" | "normal" {
    return "top";
  }
}

export class SeriesMarkersPrimitive implements ISeriesPrimitive<Time> {
  private _markers: SeriesMarker<Time>[] = [];
  private _paneView = new MarkersPaneView();
  private _attachedParams: SeriesAttachedParameter<Time> | null = null;

  setMarkers(markers: SeriesMarker<Time>[]) {
    this._markers = markers;
    this._updateViewData();
  }

  attached(params: SeriesAttachedParameter<Time>): void {
    this._attachedParams = params;
    this._updateViewData();
  }

  detached(): void {
    this._attachedParams = null;
  }

  paneViews(): readonly ISeriesPrimitivePaneView[] {
    return [this._paneView];
  }

  updateAllViews(): void {
    this._updateViewData();
  }

  hitTest(): PrimitiveHoveredItem | null {
    return null;
  }

  private _updateViewData(): void {
    if (!this._attachedParams) {
      this._paneView.setData([]);
      return;
    }

    const { chart, series } = this._attachedParams;
    const timeScale = chart.timeScale();
    const rendererData: MarkerRendererData[] = [];

    for (const marker of this._markers) {
      const x = timeScale.timeToCoordinate(marker.time);
      if (x === null) continue;

      // Get logical index for this coordinate
      const logical = timeScale.coordinateToLogical(x);
      if (logical === null) continue;

      // Get the data at this index
      const data = series.dataByIndex(logical);
      if (!data) continue;

      let price: number;
      let yOffset = 0;

      // Determine price based on marker position
      if ("high" in data && "low" in data) {
        // Candlestick data
        if (marker.position === "aboveBar") {
          price = (data as any).high;
          yOffset = -20;
        } else if (marker.position === "belowBar") {
          price = (data as any).low;
          yOffset = 20;
        } else {
          price = ((data as any).high + (data as any).low) / 2;
        }
      } else if ("value" in data) {
        // Line data
        price = (data as any).value;
        yOffset = marker.position === "aboveBar" ? -20 : 20;
      } else {
        continue;
      }

      const y = series.priceToCoordinate(price);
      if (y === null) continue;

      rendererData.push({
        x: x as number,
        y: (y as number) + yOffset,
        color: marker.color || "#2196f3",
        shape: marker.shape || "circle",
        text: marker.text,
        position: marker.position || "inBar",
      });
    }

    this._paneView.setData(rendererData);
  }
}
