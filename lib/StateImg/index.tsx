import React, { RefObject } from "react";
import styles from "./index.less";
import imgLoading from "./img/img_loading.png";
import imgError from "./img/img_error.png";
import { Empty, Icon } from "antd";
import { BasePureComponent } from "../BasePureComponent";
import StateImglazy from "./StateImglazy";
import _ from "lodash";
import Magnifier from "./Magnifier";

interface ImgProps {
  itemData?: any;
  src?: string;
  scrollDom?: any; // 用于懒加载
  markingClass?: string;
  className?: string;
  fullscreenUrl?: string;
  allowFullscreen?: boolean;
  allowMagnifier?: boolean;
  tagDesc?: any;
  onClick?: (data?: any) => void;
}

interface ImgState {
  loading: boolean;
  error: boolean;
  coverNoHeight: boolean;
}

enum RENDER_STATUS {
  IMAGE,
  LOADING,
  ERROR,
  EMPTY,
}

class StateImg extends BasePureComponent<ImgProps, ImgState> {
  private contentRef: RefObject<any>;
  private observe: any;
  private magnifier: any;

  constructor(props: ImgProps) {
    super(props);
    this.contentRef = React.createRef();
    this.state = {
      loading: true,
      error: false,
      coverNoHeight: false,
    };
    this.handleClick = this.handleClick.bind(this);
    this.imageLoad = this.imageLoad.bind(this);
    this.imageLoaded = this.imageLoaded.bind(this);
    this.boundScroll = this.boundScroll.bind(this);
  }

  imageLoad() {
    const self = this;
    if (!self.props.src) {
      return;
    }

    const img = new Image();
    img.onload = () => {
      self.setState(
        {
          loading: false,
          error: false,
        },
        this.imageLoaded,
      );
    };

    img.onerror = () => {
      self.setState({
        loading: false,
        error: true,
      });
    };

    img.src = self.props.src;

    if (self.contentRef.current && self.contentRef.current.offsetHeight < 90) {
      self.setState({
        coverNoHeight: true, // 设定一个最小高度
      });
    }
  }

  boundScroll() {
    this.unboundScroll();
    this.observe = StateImglazy.bound(
      this.props.scrollDom.current,
      this.contentRef.current,
      this.imageLoad,
    );
  }

  unboundScroll() {
    if (this.observe) {
      StateImglazy.unbound(this.observe, this.contentRef.current);
      this.observe = null;
    }
  }

  componentDidUpdate(prevProps: ImgProps, prevState: ImgState) {
    if (this.props.src !== prevProps.src) {
      if (this.props.scrollDom) {
        this.boundScroll();
      } else {
        this.imageLoad();
      }
    }
  }

  componentDidMount() {
    if (this.props.scrollDom) {
      this.boundScroll();
    } else {
      this.imageLoad();
    }
  }

  componentWillUnmount() {
    super.componentWillUnmount();
    if (this.magnifier) {
      this.magnifier.stopMagnifier();
      this.magnifier = null;
    }
    this.unboundScroll();
  }

  imageLoaded() {
    const { allowMagnifier, fullscreenUrl, src } = this.props;
    const url = fullscreenUrl || src;
    if (!allowMagnifier || !url) {
      return;
    }

    // 加载放大镜图片
    const img = new Image();
    const self = this;
    img.onload = () => {
      self.magnifier = new Magnifier(self.contentRef, img.width, img.height);
    };
    img.src = url;
  }

  handleClick() {
    if (this.props.onClick) {
      this.props.onClick(this.props.itemData);
    }
  }

  render() {
    const divProp: any = {};

    if (this.props.onClick) {
      divProp.onClick = this.handleClick;
    }

    let coverClassName = (this.props.className || "") + " stateImg ";
    if (this.props.markingClass) {
      coverClassName += this.props.markingClass;
    }

    if (!this.props.src || this.state.loading || this.state.error) {
      coverClassName += " " + styles.noImg;
    }

    let renderStatus: RENDER_STATUS;
    let allowFullscreen = this.props.allowFullscreen;
    const allowMagnifier = this.props.allowMagnifier;
    if (this.props.src) {
      if (!_.startsWith(this.props.src, "http")) {
        allowFullscreen = false;
      }
      if (this.state.error) {
        renderStatus = RENDER_STATUS.ERROR;
      } else if (this.state.loading) {
        renderStatus = RENDER_STATUS.LOADING;
      } else {
        renderStatus = RENDER_STATUS.IMAGE;
      }
    } else {
      renderStatus = RENDER_STATUS.EMPTY;
    }

    if (renderStatus !== RENDER_STATUS.IMAGE && this.state.coverNoHeight) {
      coverClassName += " defaultHeight";
    }

    return (
      <div ref={this.contentRef} {...divProp} className={coverClassName}>
        {this.props.src && this.props.src.length < 2048 && (
          <input type="hidden" value={this.props.src || ""} />
        )}
        {renderStatus === RENDER_STATUS.EMPTY && <Empty />}

        {renderStatus === RENDER_STATUS.LOADING && (
          <div className={styles.loading}>
            <img src={imgLoading} />
            <div>图片加载中</div>
          </div>
        )}

        {renderStatus === RENDER_STATUS.ERROR && (
          <div className={styles.error}>
            <img src={imgError} />
            <div>图片加载失败</div>
          </div>
        )}

        {renderStatus === RENDER_STATUS.IMAGE && <img src={this.props.src} />}

        {renderStatus === RENDER_STATUS.IMAGE && allowFullscreen && (
          <a href={this.props.fullscreenUrl || this.props.src} target="_blank">
            <Icon type="fullscreen" />
          </a>
        )}
        {this.props.tagDesc && (
          <div className="tagdesc">{this.props.tagDesc}</div>
        )}

        {renderStatus === RENDER_STATUS.IMAGE && allowMagnifier && (
          <div className={styles.innerMagnifier} />
        )}

        {renderStatus === RENDER_STATUS.IMAGE && allowMagnifier && (
          <div className={styles.outerMagnifier}>
            <img src={this.props.fullscreenUrl || this.props.src} />
          </div>
        )}
      </div>
    );
  }
}

export default StateImg;
