import React from "react";

import Canvas from ".";

class Demo extends React.Component {
  private canvas: React.RefObject<any> = React.createRef();

  handleBeforeDraw = () => {
    console.log("开始绘制");
    return 0;
  };

  handleMove = () => {
    console.log("移动中");
  };

  handleComplete = (group: number[][]) => {
    console.log("完成绘制");
    console.dir(group);
  };

  undo = () => {
    this.canvas.current.undo();
  };

  getDataSource = () => {
    const dataSource = this.canvas.current.getDataSource();
    console.dir(dataSource);
  };

  render() {
    return (
      <div>
        <button onClick={this.undo}>撤销</button>
        <button onClick={this.getDataSource}>获取数据</button>
        <div style={{ position: "relative", marginTop: 20 }}>
          <div
            style={{
              width: 853,
              height: 480,
              position: "absolute",
              top: 0,
              left: 0,
            }}
          >
            <Canvas
              ref={this.canvas}
              width={853}
              backgroundImg="https://cdn.pixabay.com/photo/2018/10/04/14/22/donut-3723751__480.jpg"
              beforeDraw={this.handleBeforeDraw}
              onMove={this.handleMove}
              onChange={this.handleComplete}
            />
          </div>
        </div>
      </div>
    );
  }
}

export default Demo;
