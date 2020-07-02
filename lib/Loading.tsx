import React from "react";
import { Icon } from "antd";
import { LoadingComponentProps } from "react-loadable";

interface BaseProps {}

type LoadingProps = BaseProps & Partial<LoadingComponentProps>;

const Loading: React.FC<LoadingProps> = (props) => {
  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        textAlign: "center",
      }}
    >
      <Icon type="loading" />
      <span style={{ marginLeft: 10 }}>加载中...</span>
    </div>
  );
};

export default Loading;
