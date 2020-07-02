import React, { RefObject } from "react";
import styles from "./index.less";
import imgLoading from "../img/img_loading.png";
import imgError from "../img/img_error.png";
import { Icon } from "antd";
import { BasePureComponent } from "../../BasePureComponent";
import StateImglazy from "../StateImglazy";
import _ from "lodash";

interface ImgProps {
  src?: string;
  scrollDom?: any;
  className?: string;
  allowFullscreen?: boolean;
  onClick?: () => void;
}

interface ImgState {
  loading: boolean;
  error: boolean;
}

enum RENDER_STATUS {
  IMGAGE,
  LOADING,
  ERROR,
  EMPTY,
}

class StateImgSmall extends BasePureComponent<ImgProps, ImgState> {
  private contentRef: RefObject<any>;
  private observe: any;

  constructor(props: ImgProps) {
    super(props);
    this.contentRef = React.createRef();
    this.state = {
      loading: true,
      error: false,
    };

    this.imageLoad = this.imageLoad.bind(this);
    this.boundScroll = this.boundScroll.bind(this);
  }

  imageLoad() {
    const self = this;
    if (!self.props.src) {
      return;
    }

    const img = new Image();
    img.onload = () => {
      self.setState({
        loading: false,
        error: false,
      });
    };

    img.onerror = () => {
      self.setState({
        loading: false,
        error: true,
      });
    };

    img.src = self.props.src;
  }

  boundScroll() {
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

  componentDidMount() {
    if (this.props.scrollDom) {
      this.boundScroll();
    } else {
      this.imageLoad();
    }
  }

  componentWillUnmount() {
    super.componentWillUnmount();
    this.unboundScroll();
  }

  render() {
    const divProp: any = {};
    if (this.props.onClick) {
      divProp.onClick = this.props.onClick;
    }

    let coverClassName = (this.props.className || "") + " stateImgSmall ";
    if (!this.props.src || this.state.loading || this.state.error) {
      coverClassName += " " + styles.noImg;
    }

    let renderStatus: RENDER_STATUS;
    let allowFullscreen = this.props.allowFullscreen;
    if (this.props.src) {
      if (!_.startsWith(this.props.src, "http")) {
        allowFullscreen = false;
      }
      if (this.state.error) {
        renderStatus = RENDER_STATUS.ERROR;
      } else if (this.state.loading) {
        renderStatus = RENDER_STATUS.LOADING;
      } else {
        renderStatus = RENDER_STATUS.IMGAGE;
      }
    } else {
      renderStatus = RENDER_STATUS.EMPTY;
      coverClassName += " " + styles.empty;
    }

    return (
      <div ref={this.contentRef} {...divProp} className={coverClassName}>
        {renderStatus === RENDER_STATUS.LOADING && (
          <div className={styles.loading}>
            <img src={imgLoading} />
          </div>
        )}

        {renderStatus === RENDER_STATUS.ERROR && (
          <div className={styles.error}>
            <img src={imgError} />
          </div>
        )}

        {renderStatus === RENDER_STATUS.IMGAGE && <img src={this.props.src} />}

        {renderStatus === RENDER_STATUS.IMGAGE && allowFullscreen && (
          <a href={this.props.src} target="_blank">
            <Icon type="fullscreen" />
          </a>
        )}
      </div>
    );
  }
}

export default StateImgSmall;
