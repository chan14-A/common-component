import React from "react";
import styles from "./noData.less";
import src from "./nodata.png";

interface NoDataProps {
  text?: string;
}
const NoData: React.FC<NoDataProps> = ({ text }) => {
  return (
    <div className={styles.noData}>
      <div>
        <img src={src} />
        <div>{text || "没有数据"}</div>
      </div>
      <span className="gvAlignMiddle" />
    </div>
  );
};

export default NoData;
