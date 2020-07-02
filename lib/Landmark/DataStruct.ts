import { Group, Element } from "zrender";

export enum DRAW_TYPE {
  line = "line",
  rect = "rect",
  polygon = "polygon",
  circle = "circle",
  line_arrow = "line_arrow",
}

class DataGroup {
  // 背景图片变形比例
  // 这里的算法实际上ratioX === ratioY，因为是等比例放大
  ratioX: number = 1;
  ratioY: number = 1;
  // 背景图长宽比，目前仅仅在播放器蒙层上有用，保证resize时候，保持该比例
  ratioXY: number = 1;

  // 当前绘画的一个图形的数据
  private group?: Group;
  // 历史所有绘画完毕的一系列的group
  private dataSourceGroup?: any;
  // 表示当前的dataSourceGroup是dataSourceGroupMap中的哪一个key
  private currentDataSourceKey?: string;
  // 绘画的总的区域分类（警察区、嫌犯区、红绿灯之类的）
  // {"police": Group[], "other": Group[]}
  private dataSourceGroupMap = {};

  switchMainGroup(key: string, name?: string, limitPoint?: number) {
    if (this.currentDataSourceKey === key) {
      return;
    }

    key = "key_" + key;
    if (this.dataSourceGroupMap[key]) {
      this.dataSourceGroup = this.dataSourceGroupMap[key];
    } else {
      this.dataSourceGroup = {
        key,
        data: [],
      };
      if (name) {
        this.dataSourceGroup.name = name;
        this.dataSourceGroup.limitPoint = limitPoint;
      }
      this.dataSourceGroupMap[key] = this.dataSourceGroup;
    }
    this.currentDataSourceKey = key;
    this.group = undefined;
  }

  setRatio(ratioX: number, ratioY: number, ratioXY?: number) {
    // 目前ratioX === ratioY
    if (this.ratioX !== ratioX) {
      // const tempRatio = ratioX / this.ratioX;
      // if (this.dataSourceGroupMap) {
      //   const keys = Object.keys(this.dataSourceGroupMap);
      //   for (const k of keys) {
      //     const groups = this.dataSourceGroupMap[k].data;
      //     for (const group of groups) {
      //       for (const child of group.children()) {
      //         if (!child.setShape) {
      //           continue;
      //         }
      //         const opt = {...child.shape};
      //         if (child.type === DRAW_TYPE.circle) {
      //           opt.cx *= tempRatio;
      //           opt.cy *= tempRatio;
      //         } else if (child.type === DRAW_TYPE.line) {
      //           opt.x1 *= tempRatio;
      //           opt.x2 *= tempRatio;
      //           opt.y1 *= tempRatio;
      //           opt.y2 *= tempRatio;
      //         }
      //         child.setShape(opt);
      //       }
      //     }
      //   }
      // }
      this.ratioX = ratioX;
      this.ratioY = ratioY;
      if (ratioXY) {
        this.ratioXY = ratioXY;
      }
    }
  }

  getRatio() {
    return {
      ratioX: this.ratioX,
      ratioY: this.ratioY,
      ratioXY: this.ratioXY,
    };
  }

  getGroup() {
    return this.group;
  }

  getCurrentDataSourceKey() {
    return this.currentDataSourceKey;
  }

  getMainGroupName() {
    return this.dataSourceGroup.name || "";
  }

  getMainGroupLimit() {
    return this.dataSourceGroup.limitPoint;
  }

  createGroup(id?: number, key?: string) {
    if (key && key !== this.currentDataSourceKey) {
      this.switchMainGroup(key);
    }

    if (!id) id = undefined;
    this.group = new Group(id);
    return this.group;
  }

  completeCurrentGroup() {
    if (this.group) {
      this.dataSourceGroup.data.push(this.group);
    }
  }

  clearAllGroup() {
    const groups: any = [];
    for (const key of Object.keys(this.dataSourceGroupMap)) {
      if (this.dataSourceGroupMap.hasOwnProperty(key)) {
        groups.push(...this.dataSourceGroupMap[key].data);
      }
    }
    // if (this.group) {
    //   groups.push(this.group);
    // }

    this.dataSourceGroup = null;
    this.group = undefined;
    this.currentDataSourceKey = undefined;
    this.dataSourceGroupMap = {};

    return groups;
  }

  childOfType(type: string, group?: Group) {
    const current = group || this.group;
    if (!current) return [];
    return current.children().filter((item: Element) => item.type === type);
  }

  removeGroup(id?: number, key?: string) {
    if (!this.dataSourceGroup) {
      return;
    }

    if (!id) {
      return this.group || this.dataSourceGroup.data.pop();
    }

    if (key && key !== this.currentDataSourceKey) {
      this.switchMainGroup(key);
    }

    let group;
    let i = 0;
    for (; i < this.dataSourceGroup.data.length; i++) {
      const g = this.dataSourceGroup.data[i];
      if (g.id === id) {
        group = this.group = g;
        break;
      }
    }
    if (group) {
      this.dataSourceGroup.data.splice(i, 1);
    }

    return group;
  }

  reset() {
    this.group = undefined;
  }

  normalizeData(data: number[]) {
    return [data[0] / this.ratioX, data[1] / this.ratioY];
  }
}

export default DataGroup;
