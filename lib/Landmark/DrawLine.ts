import DrawBase, { IDrawBase } from "./DrawBase";
import zrender, { Circle, Line, ZRender, Element } from "zrender";
import DataStruct from "./DataStruct";

class DrawLine extends DrawBase implements IDrawBase {
  // 是否有交叉
  private isIntersect: boolean = false;
  constructor(zr: ZRender, props: any, dataStruct: DataStruct, color: string) {
    super(zr, props, dataStruct, color);
    this.handleMouseDown = this.handleMouseDown.bind(this);
    this.handleMouseMove = this.handleMouseMove.bind(this);
  }

  draw(event: any, newId?: number) {
    let group;
    const { offsetX, offsetY } = event;
    if (this.started()) {
      group = this.dataStruct.getGroup();
    } else {
      // 开始绘制
      this.start();
      group = this.dataStruct.createGroup(newId);
      this.zr.add(group);
      const name = this.dataStruct.getMainGroupName();
      if (name) {
        // 根据文字起点坐标，判断文字距离画布边框的边距
        const width = this.zr.dom.clientWidth;
        const height = this.zr.dom.offsetHeight;
        const pageX = Number((offsetX / width).toFixed(2));
        const pageY = Number((offsetY / height).toFixed(2));
        let textX = offsetX;
        let textY = offsetY;

        if (pageX < 0.5) {
          textX = textX + 20;
        } else if (pageX > 0.5) {
          textX = textX - 20;
        }

        if (pageY < 0.5) {
          textY = textY + 15;
        } else if (pageY > 0.5) {
          textY = textY - 15;
        }
        const txt = new zrender.Text({
          style: {
            x: textX,
            y: textY,
            // width:,
            // height:,
            text: name,
            textFill: this.color,
          },
        });
        group.add(txt);
      }
    }

    if (!group) {
      return;
    }

    if (this.checkIsSamePosition(offsetX, offsetY)) return;

    const junction = this.junction(offsetX, offsetY, 3, this.color);
    group.add(junction);

    const groupJunction = this.dataStruct.childOfType("circle");
    if (groupJunction.length > 1) {
      this.close(event);
      return;
    }
    // 画一个长度为0的线，鼠标移动后变成有长度
    const line = this.line(offsetX, offsetY, offsetX, offsetY, this.color);
    group.add(line);
  }

  // 右键自动闭合
  close(event: any, restore?: boolean) {
    if (!this.started()) return;
    const group = this.dataStruct.getGroup();
    if (!group) return;

    this.dataStruct.completeCurrentGroup();
    this.onChange();
    this.reset();
  }

  onChange() {
    if (!this.props.onChange) {
      return;
    }

    const { ratioX, ratioY } = this.dataStruct;
    const circleList = this.dataStruct.childOfType("circle");
    const scope = circleList.map((el: Element) => {
      const { cx, cy } = el.shape;
      const x = Math.round(cx * ratioX);
      const y = Math.round(cy * ratioY);
      return [x, y];
    });

    this.props.onChange(scope);
  }

  // 重置
  reset() {
    this.dataStruct.reset();
    super.reset();
    this.isIntersect = false;
  }

  handleMouseDown(event: MouseEvent) {
    if (this.isIntersect) return;

    const beforeDraw = this.props.beforeDraw;
    let newId;
    if (beforeDraw) {
      newId = beforeDraw(event);
      if (newId === -1) return;
    }

    this.draw(event, newId);
  }

  handleMouseMove(event: any) {
    if (!this.started()) return;

    const onMove = this.props.onMove;
    if (onMove) {
      onMove(event);
    }

    const { offsetX, offsetY } = event;
    const groupLine = this.dataStruct.childOfType("line");
    const current = groupLine.pop();

    if (!current) return;

    current.setShape({ x2: offsetX, y2: offsetY });
  }

  // 连接点
  private junction = (
    cx: number,
    cy: number,
    r: number,
    color: string,
  ): Circle => {
    return new zrender.Circle({
      shape: { cx, cy, r },
      style: { stroke: color, fill: color },
    });
  };

  // 连接线
  private line = (
    x1: number,
    y1: number,
    x2: number,
    y2: number,
    color: string,
  ): Line => {
    return new zrender.Line({
      shape: { x1, y1, x2, y2 },
      style: { stroke: color, lineWidth: 2 },
    });
  };
}

export default DrawLine;
