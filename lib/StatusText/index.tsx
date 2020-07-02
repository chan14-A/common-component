import { BasePureComponent } from "../BasePureComponent";
import React from "react";
import styles from "./index.less";

interface StatusTextProps {
  text: string;
  code?: string; // 用于父组建绑定事件时使用，暂时无用
  textColor?: string;
  backgroundColor: string;
  width?: string;
  animation?: boolean;
}

class StatusTextContainer extends BasePureComponent<StatusTextProps, any> {
  render() {
    const mainStyle = {
      width: this.props.width || "70px",
      color: this.props.textColor || "#fff",
      backgroundColor: this.props.backgroundColor,
    };

    let className = styles.statusText;
    if (this.props.animation) {
      className += " " + styles.statusAnimation;
    }

    return (
      <div style={mainStyle} className={className}>
        {this.props.text}
      </div>
    );
  }
}

export default StatusTextContainer;
