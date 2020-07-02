import React from "react";
import copy from "copy-to-clipboard";
import { message } from "antd";

interface TitleSpanProps {
  className?: string;
  children: any;
  style?: any;
}

const TitleSpan: React.FC<TitleSpanProps> = (props) => {
  const copyValue = () => {
    if (copy(props.children)) {
      message.success("复制成功");
    }
  };

  const extraProps: any = {
    onDoubleClick: copyValue,
    title: props.children,
  };

  if (props.style) {
    extraProps.style = props.style;
  }

  if (props.className) {
    extraProps.className = props.className;
  }

  return <span {...extraProps}>{props.children}</span>;
};

export default TitleSpan;
