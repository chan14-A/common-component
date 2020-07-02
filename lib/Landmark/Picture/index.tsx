import React from "react";
import zrender, { ZRender, Circle, Line, Text } from "zrender";

import styles from "./index.less";
import { getPolygonAreaCenter } from "src/common/util";

/**
 * 用于编辑和详情时显示画线
 */

interface PictureProps {
  uri: string;
  coordinates: Coordinate[];
}

export interface Coordinate {
  text: string;
  scope: number[][];
  center?: boolean;
}

class Picture extends React.Component<PictureProps, any> {
  private dom: React.RefObject<HTMLDivElement> = React.createRef();
  private zr?: ZRender;

  constructor(props: PictureProps) {
    super(props);
    this.state = {
      style: {
        width: 0,
        height: 0,
      },
    };
  }

  handleImageLoad = (e: any) => {
    const { clientWidth, clientHeight, naturalWidth, naturalHeight } = e.target;

    const ratioX = clientWidth / naturalWidth;
    const ratioY = clientHeight / naturalHeight;

    const imgDom = e.target;

    this.setState(
      {
        style: {
          width: clientWidth,
          height: clientHeight,
        },
      },
      () => {
        const { coordinates } = this.props;

        const current = this.dom.current;

        // 初始化ZRender
        this.zr = this.initZr(current, imgDom, 1 / ratioX) as ZRender;
        if (!this.zr) {
          return;
        }

        // 绘制布控区域
        coordinates.forEach((item: Coordinate) => {
          this.draw(
            item.scope,
            ratioX,
            ratioY,
            "#1890ff",
            item.text,
            item.center,
          );
        });
      },
    );
  };

  initZr = (dom: any, imgDom: any, ratioX: number) => {
    if (!dom) return null;

    const zr = zrender.init(dom, { devicePixelRatio: ratioX });

    const img = new zrender.Image({
      style: {
        image: imgDom.src,
        x: 0,
        y: 0,
        width: imgDom.width,
        height: imgDom.height,
      },
    });

    zr.add(img);

    return zr;
  };

  draw = (
    scope: number[][],
    ratioX: number,
    ratioY: number,
    color: string,
    text: string,
    center: boolean = true,
  ) => {
    if (!this.zr) {
      return;
    }
    const length = scope.length;
    for (let j = 0; j < length; j += 1) {
      const current = scope[j];
      const x1 = Math.round(ratioX * current[0]);
      const y1 = Math.round(ratioY * current[1]);

      const nextIndex = j + 1 < length ? j + 1 : 0;
      const next = scope[nextIndex];
      const x2 = Math.round(ratioX * next[0]);
      const y2 = Math.round(ratioY * next[1]);

      const [tx, ty] = getPolygonAreaCenter(scope);

      if (j === 0) {
        const t = this.text(text, color, tx * ratioX, ty * ratioY);
        // const t = this.text(text, color, x1, y1);
        this.zr.add(t);
      }

      const junction = this.junction(x1, y1, 5, color);
      this.zr.add(junction);
      const line = this.line(x1, y1, x2, y2, color);
      this.zr.add(line);

      // 绘制中心点
      if (center) {
        const cen = this.calculateCenter(scope, ratioX, ratioY);
        const jun = this.junction(cen[0], cen[1], 2, "#ff5500");
        this.zr.add(jun);
      }
    }
  };

  // 连接点
  junction = (cx: number, cy: number, r: number, color: string): Circle => {
    return new zrender.Circle({
      shape: { cx, cy, r },
      style: { stroke: color, fill: color },
    });
  };

  // 连接线
  line = (
    x1: number,
    y1: number,
    x2: number,
    y2: number,
    stroke: string,
  ): Line => {
    return new zrender.Line({
      shape: { x1, y1, x2, y2 },
      style: { stroke, lineWidth: 2 },
    });
  };

  // 文字
  text = (text: string, color: string, x: number, y: number): Text => {
    return new zrender.Text({
      position: [x + 10, y + 10],
      style: {
        text,
        textFill: color,
        fontSize: "16",
      },
    });
  };

  calculateCenter = (pts: number[][], ratioX: number, ratioY: number) => {
    const x = (pts[0][0] * ratioX + pts[1][0] * ratioX) * 0.5;
    const y = pts[0][1] * 0.25 * ratioY + pts[3][1] * 0.75 * ratioY;
    return [x, y];
  };

  render() {
    const { style } = this.state;
    const { uri } = this.props;

    return (
      <div className={styles.picture}>
        <img src={uri} alt="截图" onLoad={this.handleImageLoad} />
        <div className={styles.canvas} style={style} ref={this.dom} />
      </div>
    );
  }
}

export default Picture;
