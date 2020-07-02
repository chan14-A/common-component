import React from "react";
import zrender, { ZRender, Group } from "zrender";
import DataStruct, { DRAW_TYPE } from "./DataStruct";
import { BasePureComponent } from "../BasePureComponent";
import { IDrawBase } from "./DrawBase";
import DrawRect from "./DrawRect";
import DrawLine from "./DrawLine";
import DrawPolygon from "./DrawPolygon";
import DrawLineArrow from "./DrawLineArrow";
import _ from "lodash";
import $ from "jquery";
import { PointerEventsProperty } from "csstype";

const DEFAULT_COLOR = "#1890ff";

export interface LandmarkRestoreData {
  mainGroupId: string;
  color: string;
  data: number[][][];
  type?: DRAW_TYPE;
  name?: string;
}

/**
 * 用于画线
 */
interface LandmarkProps {
  // 默认宽度
  width?: number | string;
  // 背景图
  backgroundImg?: string;
  // 隐藏图片
  hideImage?: boolean; // 仅仅获取图片高宽，并不显示
  // 自动开始绘画状态
  autoBegin?: boolean;
  // 背景css颜色
  background?: string;
  // 是否resize
  useResize?: boolean;
  // border styles
  border?: string;
  // 最外层不用div包裹，仅仅是裸canvas，好处是可以根据父元素调整大小，适合透明背景画线使用
  useSingleCanvas?: boolean;
  onRef?: (ref: any) => void;
  beforeDraw?: (event: MouseEvent) => number | undefined;
  onMove?: (event: MouseEvent) => void;
  onChange?: (scope: number[][]) => void;
  onUndo?: (key: string, group: Group) => void;
  onImageLoad?: (ref?: Landmark) => void;
  initData?: LandmarkRestoreData[];
  onEnd?: () => void;
  // 更新背景图后，高度会变化，目前width可以忽略;
  onResize?: (width: number, height: number) => void;
}

interface StateInstance {
  currentInstance?: Landmark;
}

const global_instance_para: StateInstance = {
  currentInstance: undefined,
};

class Landmark extends BasePureComponent<LandmarkProps, any> {
  static DRAW_TYPE = DRAW_TYPE;
  // 外层div
  private containerDiv: React.RefObject<any> = React.createRef();
  private zr?: ZRender;
  // private initWidth: number;

  private dataStruct: DataStruct = new DataStruct();
  // 保存背景图实例，用于删除或替换
  private img?: zrender.Image;
  private imgDom: any;
  // 是否开始监听鼠标事件
  private mouseBound: boolean = false;

  private drawInstanse?: IDrawBase;
  private resizeTestThrottle: any;

  constructor(props: LandmarkProps) {
    super(props);
    this.zr = undefined;
    this.img = undefined;
    this.drawInstanse = undefined;
    this.state = {
      height: "100%",
    };
    this.resizeTest = this.resizeTest.bind(this);
    this.resizeTestThrottle = _.throttle(this.resizeTest, 500);

    // this.beginPaint = this.beginPaint.bind(this);
    // this.endPaint = this.endPaint.bind(this);
  }

  // 切换画线的组，一组代表一种类型，如果是画线中切换会放弃正在画的线
  // 应该调用此接口之前主动调用undo，否则此接口不处理
  // TODO 不对，一个类型应该包含多个组，也就是说包含多个图形
  // dataSouceGroupId例如嫌犯区，警察区
  // groupId 第几条线或者框
  // 为了同时支持只有同一组和多个组的情况，此组件，必须调用这个才能开始绘画
  switchMainGroup(
    dataSouceGroupId: string,
    name?: string,
    limitPoint?: number,
  ) {
    if (this.drawInstanse && this.drawInstanse.started()) {
      console.error(
        "you should not switch group in drawing, please undo or close the drawing first",
      );
      return;
    }

    this.dataStruct.switchMainGroup(dataSouceGroupId, name, limitPoint);
  }

  isBegin() {
    return this.mouseBound;
  }

  isPainting() {
    if (this.drawInstanse && this.drawInstanse.started()) {
      return true;
    }

    return false;
  }

  getBase64Capture() {
    if (!this.containerDiv || !this.containerDiv.current) {
      return;
    }

    const $canvas = $(this.containerDiv.current).find("canvas")[0];
    if (!$canvas) {
      return;
    }
    const dataURL = $canvas.toDataURL("image/png");
    return dataURL;
  }

  resizeTest() {
    if (!this.props.useResize || !this.zr) {
      return;
    }
    const current = this.containerDiv.current;
    if (!current || !current.parentElement) {
      return;
    }

    const dom = current.parentElement;
    const ratio = this.dataStruct.getRatio();
    // 这里的算法实际上ratioX === ratioY，因为是等比例放大
    let width: number;
    let height: number;
    if (dom.clientWidth / ratio.ratioXY > dom.clientHeight) {
      height = dom.clientHeight;
      width = height * ratio.ratioXY;
    } else {
      width = dom.clientWidth;
      height = width / ratio.ratioXY;
    }

    const newRatio = this.imgDom.width / width;
    this.dataStruct.setRatio(newRatio, newRatio);
    this.zr.resize({ width, height });
    const self = this;
    setTimeout(() => {
      self.clearAllData();
      if (self.props.onImageLoad) {
        self.props.onImageLoad(self);
      }
    }, 0);
  }

  handleResize() {
    if (!this.props.useResize) {
      return;
    }
    window.addEventListener("resize", this.resizeTestThrottle);
  }

  beginPaint(color?: string, type?: DRAW_TYPE) {
    if (this.mouseBound || !this.zr) {
      console.error("alread start paint");
      return;
    }
    this.clearOtherInstantce();

    switch (type) {
      case DRAW_TYPE.rect:
        this.drawInstanse = new DrawRect(
          this.zr,
          this.props,
          this.dataStruct,
          color || DEFAULT_COLOR,
        );
        break;
      case DRAW_TYPE.line:
        this.drawInstanse = new DrawLine(
          this.zr,
          this.props,
          this.dataStruct,
          color || DEFAULT_COLOR,
        );
        break;
      case DRAW_TYPE.line_arrow:
        this.drawInstanse = new DrawLineArrow(
          this.zr,
          this.props,
          this.dataStruct,
          color || DEFAULT_COLOR,
        );
        break;
      case DRAW_TYPE.polygon:
      default:
        this.drawInstanse = new DrawPolygon(
          this.zr,
          this.props,
          this.dataStruct,
          color || DEFAULT_COLOR,
        );
        break;
    }

    this.zr.on("mousedown", this.drawInstanse.handleMouseDown, this);
    this.zr.on("mousemove", this.drawInstanse.handleMouseMove, this);
    this.mouseBound = true;
  }

  endPaint() {
    if (!this.mouseBound || !this.drawInstanse || !this.zr) {
      return;
    }
    if (this.drawInstanse.started()) {
      this.undo();
    }
    this.mouseBound = false;
    this.zr.off("mousedown", this.drawInstanse.handleMouseDown, this);
    this.zr.off("mousemove", this.drawInstanse.handleMouseMove, this);
    this.reset();
    if (this.props.onEnd) {
      this.props.onEnd();
    }
  }

  clearAllData() {
    if (!this.zr) {
      return;
    }
    if (this.isPainting()) {
      this.undo();
    }
    this.endPaint();
    const groups = this.dataStruct.clearAllGroup();
    for (const group of groups) {
      this.zr.remove(group);
    }
    if (this.drawInstanse) {
      this.drawInstanse.reset();
    }
  }

  changeImg(url: string, callback?: any) {
    // 更换图片清除所有图形
    this.clearAllData();
    const self = this;
    if (!self.zr) {
      return;
    }
    const imgDom = new Image();
    this.imgDom = imgDom;
    if (self.img) {
      self.zr.remove(self.img);
    }

    imgDom.setAttribute("crossOrigin", "Anonymous");
    imgDom.onload = () => {
      if (!this.containerDiv.current || !self.zr) {
        return;
      }
      const width = this.containerDiv.current.clientWidth;
      // this.initWidth = width;
      // 这里的算法实际上ratioX === ratioY，因为是等比例放大
      const height = (width / imgDom.width) * imgDom.height;
      // 首次resize结束后，zrender才去生成canvas，如果这时候外层div还没有改变size，就会取旧的size，所以要主动传进去，而且要在setState之后
      const resize = () => {
        // 更新宽高比
        const ratioX = imgDom.width / width;
        const ratioY = imgDom.height / height;

        self.dataStruct.setRatio(ratioX, ratioY, width / height);

        if (self.zr) {
          self.resizeTest();
          if (!self.props.useResize) {
            self.zr.resize({
              width,
              height,
            });
          }
        } else {
          return;
        }

        // 仅仅获取图片高宽，并不显示
        if (!self.props.hideImage) {
          self.img = new zrender.Image({
            style: {
              image: imgDom.src,
              x: 0,
              y: 0,
              width,
              height,
            },
          });
          self.zr.add(self.img);
        }

        if (this.props.onResize) {
          this.props.onResize(width, height);
        }
        if (callback) {
          callback();
        }

        if (!this.props.useResize && this.props.onImageLoad) {
          this.props.onImageLoad(this);
        }
      };

      // 更新画布外层div以适应图片高宽比
      this.setState(
        {
          height,
        },
        resize,
      );
    };

    imgDom.src = url;
  }

  restoreData(
    mainGroupId: string,
    color: string,
    data: number[][][],
    type?: DRAW_TYPE,
    name?: string,
  ) {
    if (!data) {
      return;
    }

    this.switchMainGroup(mainGroupId, name);
    this.beginPaint(color, type);
    if (!this.drawInstanse) {
      return;
    }

    let init: boolean = false;
    for (const d of data) {
      for (const item of d) {
        const o = this.dataStruct.normalizeData(item);
        const e = {
          offsetX: o[0],
          offsetY: o[1],
        };
        if (init) {
          this.drawInstanse.handleMouseMove(e);
        } else {
          init = true;
        }
        this.drawInstanse.draw(e);
      }
      this.drawInstanse.close({}, true);
    }

    this.endPaint();
  }

  componentDidMount() {
    const current = this.containerDiv.current;
    if (current) {
      // devicePixelRatio仅非singleCanvas场景有效
      this.zr = zrender.init(current, { devicePixelRatio: 2 });
      if (this.props.backgroundImg) {
        this.changeImg(this.props.backgroundImg);
      }

      current.oncontextmenu = () => false;
      if (this.props.autoBegin) {
        this.beginPaint();
      }
    }

    if (this.props.onRef) {
      this.props.onRef(this);
    }

    if (this.props.initData && this.props.initData.length) {
      for (const data of this.props.initData) {
        this.restoreData(
          data.mainGroupId,
          data.color,
          data.data,
          data.type,
          data.name,
        );
      }
    }

    this.handleResize();
  }

  componentDidUpdate(prevProps: LandmarkProps, prevState: any) {
    if (
      this.props.backgroundImg &&
      this.props.backgroundImg !== prevProps.backgroundImg
    ) {
      this.changeImg(this.props.backgroundImg);
    }

    if (
      this.props.initData !== prevProps.initData &&
      this.props.initData &&
      this.props.initData.length
    ) {
      for (const data of this.props.initData) {
        this.restoreData(
          data.mainGroupId,
          data.color,
          data.data,
          data.type,
          data.name,
        );
      }
    }
  }

  componentWillUnmount() {
    super.componentWillUnmount();
    this.endPaint();
    if (global_instance_para.currentInstance === this) {
      global_instance_para.currentInstance = undefined;
    }
    window.removeEventListener("resize", this.resizeTestThrottle);
  }

  // 撤销
  undo = (id?: number) => {
    const onUndo = this.props.onUndo;
    const hasCurrent = !!this.dataStruct.getGroup();
    const group = this.dataStruct.removeGroup(id);
    if (!group) return;
    if (this.zr) {
      this.zr.remove(group);
    }
    this.reset();
    const key = this.dataStruct.getCurrentDataSourceKey();
    if (!hasCurrent && onUndo && key) {
      onUndo(key, group);
    }
  };

  render() {
    // 使用本组件外层div的width一定要用style而不是class定义，因为框架会延迟加载css，会导致页面宽高不符合预期
    // 造成zrender生成时取不到正确的width
    const { background, border } = this.props;
    const style = {
      width: this.props.width || "100%",
      height: this.state.height,
      background: background || "#F1F1F1",
      border: border || "1px solid #F0F0F0",
      verticalAlign: "middle",
      pointerEvents:
        this.props.background === "transparent"
          ? "none"
          : ("auto" as PointerEventsProperty),
    };
    if (this.props.useSingleCanvas) {
      return <canvas style={style} ref={this.containerDiv} />;
    } else {
      return <div style={style} ref={this.containerDiv} />;
    }
  }

  // 重置
  private reset() {
    if (this.drawInstanse) {
      this.drawInstanse.reset();
    }
  }

  private clearOtherInstantce() {
    if (
      global_instance_para.currentInstance &&
      global_instance_para.currentInstance !== this
    ) {
      global_instance_para.currentInstance.endPaint();
    }

    global_instance_para.currentInstance = this;
  }
}

export default Landmark;
