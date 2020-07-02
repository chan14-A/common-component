import DrawBase, { ERROR_COLOR, IDrawBase } from "./DrawBase";
import zrender, { Circle, Line, ZRender, Element } from "zrender";
import DataStruct from "./DataStruct";
import { message } from "antd";

class DrawPolygon extends DrawBase implements IDrawBase {
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
      // 第一次绘制
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

    const pointLimit = this.dataStruct.getMainGroupLimit();
    if (pointLimit) {
      const groupJunction = this.dataStruct.childOfType("circle");
      if (groupJunction.length >= pointLimit) {
        const name = this.dataStruct.getMainGroupName();
        message.error(
          name +
            "要求不能超过" +
            pointLimit +
            "个点位数，你可以结束或撤销本次绘画",
        );
        return;
      }
    }

    const junction = this.junction(offsetX, offsetY, 3, this.color);
    group.add(junction);

    // 画一个长度为0的线，鼠标移动后变成有长度
    const line = this.line(offsetX, offsetY, offsetX, offsetY, this.color);
    group.add(line);
  }

  // 右键自动闭合
  close(event: any, restore?: boolean) {
    if (!this.started()) return;
    const group = this.dataStruct.getGroup();
    if (!group) return;

    // 所有点位
    const groupJunction = this.dataStruct.childOfType("circle");

    // if (groupJunction.length < 3) return;
    if (groupJunction.length < 2) {
      // 1个，2个点不处理 return;
      return;
    }
    const pointLimit = this.dataStruct.getMainGroupLimit();
    if (pointLimit) {
      if (groupJunction.length !== pointLimit) {
        const name = this.dataStruct.getMainGroupName();
        message.error(name + "要求至少" + pointLimit + "个点位");
        return;
      }
    }

    // 最少三个节点才能闭合
    // 自动闭合多边形
    const firstJunction = groupJunction[0];
    const groupLine = this.dataStruct.childOfType("line");
    // 判断闭合线段和已绘制线段是否相交
    // 获取最后一条线段，即为闭合线段
    const lastLine = groupLine.pop();
    if (!lastLine) return;

    // 做一个虚拟的线，用来判断是否相交
    // 数据恢复时不做相交判断
    if (!restore) {
      const virtualLine = this.line(
        lastLine.shape.x1,
        lastLine.shape.y1,
        firstJunction.shape.cx,
        firstJunction.shape.cy,
        this.color,
      );
      // 判断是否相交
      // 从要判断的数组里删除相邻的线段，线段永远不会与第一根，最后一根线，最后一根正在画的线相交。。。
      // 所以把这三个都要pop出来
      groupLine.pop();
      groupLine.shift();
      const isIntersect = this.checkIsIntersect(virtualLine, groupLine);
      if (isIntersect) {
        return;
      }
    }
    // 不相交则最终确定最后一根正在画的线的最终位置为第一个点
    lastLine.setShape({
      x2: firstJunction.shape.cx,
      y2: firstJunction.shape.cy,
    });

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

    if (event.which === 1) {
      this.draw(event, newId);
    } else if (event.which === 3) {
      this.close(event);
    }
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

    // 判断相交
    // 相邻两套线段必定相交，因为连接点相同
    // 所以去除这条线段
    groupLine.pop();
    this.isIntersect = this.checkIsIntersect(current, groupLine);
    current.setStyle({
      stroke: this.isIntersect ? ERROR_COLOR : this.color,
    });
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

export default DrawPolygon;
