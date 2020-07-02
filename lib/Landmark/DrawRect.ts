import DrawBase, { IDrawBase } from "./DrawBase";
import zrender, { Rect, ZRender } from "zrender";
import DataStruct from "./DataStruct";

class DrawRect extends DrawBase implements IDrawBase {
  constructor(zr: ZRender, props: any, dataStruct: DataStruct, color: string) {
    super(zr, props, dataStruct, color);
    this.handleMouseDown = this.handleMouseDown.bind(this);
    this.handleMouseMove = this.handleMouseMove.bind(this);
  }

  draw(event: any, newId?: number) {
    // 第一次绘制
    if (this.started()) {
      this.close(event);
      return;
    }

    this.start();
    const group = this.dataStruct.createGroup(newId);
    this.zr.add(group);
    if (!group) {
      return;
    }

    const { offsetX, offsetY } = event;
    const rect = this.rect(offsetX, offsetY, 0, 0, 3, this.color);
    group.add(rect);
  }

  // 右键自动闭合
  close(event: any, restore?: boolean) {
    if (!this.started()) return;

    const group = this.dataStruct.getGroup();
    if (!group) {
      return;
    }
    // 每次onChange只会画一个矩形，所以取0元素即可
    const child = group.children()[0];
    if (!child) {
      return;
    }

    const shape = child.shape;
    if (Math.abs(shape.width) < 5 || Math.abs(shape.height) < 5) {
      return;
    }

    this.dataStruct.completeCurrentGroup();
    this.onChange();
    this.reset();
  }

  onChange() {
    if (!this.props.onChange) {
      return;
    }

    const group = this.dataStruct.getGroup();
    if (!group) {
      return;
    }
    // 每次onChange只会画一个矩形，所以取0元素即可
    const child = group.children()[0];
    if (!child) {
      return;
    }

    const shape = child.shape;
    const firstPoint: any = {};
    const secondPoint: any = {};
    if (shape.width < 0) {
      firstPoint.x = shape.x + shape.width;
      secondPoint.x = shape.x;
    } else {
      firstPoint.x = shape.x;
      secondPoint.x = shape.x + shape.width;
    }

    if (shape.height < 0) {
      firstPoint.y = shape.y + shape.height;
      secondPoint.y = shape.y;
    } else {
      firstPoint.y = shape.y;
      secondPoint.y = shape.y + shape.height;
    }

    const { ratioX, ratioY } = this.dataStruct;
    const scope = [];
    scope.push([
      Math.round(firstPoint.x * ratioX),
      Math.round(firstPoint.y * ratioY),
    ]);
    scope.push([
      Math.round(secondPoint.x * ratioX),
      Math.round(secondPoint.y * ratioY),
    ]);

    this.props.onChange(scope);
  }

  // 重置
  reset() {
    super.reset();
    this.dataStruct.reset();
  }

  handleMouseDown(event: MouseEvent) {
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

    const group = this.dataStruct.getGroup();
    if (!group) return;
    const children = group.children();
    const rect = children[children.length - 1];

    rect.setShape({
      width: offsetX - rect.shape.x,
      height: offsetY - rect.shape.y,
    });
  }

  private rect = (
    x: number,
    y: number,
    width: number,
    height: number,
    r: number,
    color: string,
  ): Rect => {
    return new zrender.Rect({
      shape: { r, x, y, width, height },
      style: { stroke: color, lineWidth: 2, fill: "transparent" },
    });
  };
}

export default DrawRect;
