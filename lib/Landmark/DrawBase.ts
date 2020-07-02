import { checkIntersect } from "./util";
import { Line, ZRender } from "zrender";
import DataStruct from "./DataStruct";

export const ERROR_COLOR = "#ff4444";

export interface IDrawBase {
  draw: (event: any, newId?: number) => void;
  close: (event: any, restore?: boolean) => void;
  handleMouseDown: (event: MouseEvent) => void;
  handleMouseMove: (event: any) => void;
  started: () => boolean;
  reset: () => void;
}

class DrawBase {
  props: any;
  color: string;
  dataStruct: DataStruct;

  // 是否已经开始绘画
  zr: ZRender;
  private isStart: boolean = false;

  constructor(zr: ZRender, props: any, dataStruct: DataStruct, color: string) {
    this.props = props;
    this.color = color;
    this.dataStruct = dataStruct;
    this.zr = zr;
  }

  start() {
    this.isStart = true;
  }

  stop() {
    this.isStart = false;
  }

  started() {
    return this.isStart;
  }

  reset() {
    this.stop();
  }

  // 判断指定线段是否和已知线段相交
  checkIsIntersect(line: Line, groupLine: Line[]) {
    for (let i = 0; i < groupLine.length; i += 1) {
      const current = groupLine[i];
      const isCross = checkIntersect(
        { x: line.shape.x1, y: line.shape.y1 },
        { x: line.shape.x2, y: line.shape.y2 },
        { x: current.shape.x1, y: current.shape.y1 },
        { x: current.shape.x2, y: current.shape.y2 },
      );
      // 直接返回会中断当前循环，不再遍历其他线段
      if (isCross) {
        return true;
      }
    }
    return false;
  }

  // 判断两次点击的位置是否相同
  // 相同则不尽兴绘制
  checkIsSamePosition = (x: number, y: number): boolean => {
    const groupJunction = this.dataStruct.childOfType("circle");
    if (groupJunction.length) {
      const junction = groupJunction[groupJunction.length - 1];
      const { cx, cy } = junction.shape;
      return x === cx && y === cy;
    }
    return false;
  };
}

export default DrawBase;
