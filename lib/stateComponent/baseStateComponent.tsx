import { BasePureComponent } from "../BasePureComponent";

// 通用参数，用于State*类型控件做互斥操作
interface StateInstance {
  currentInstance?: BaseStateComponent;
}

const global_instance_para: StateInstance = {
  currentInstance: undefined,
};

export class BaseStateComponent<
  P = {},
  S = {},
  SS = any
> extends BasePureComponent<P, S, SS> {
  constructor(props: P) {
    super(props);
  }

  clearOtherInstantce() {
    if (
      global_instance_para.currentInstance &&
      global_instance_para.currentInstance !== this
    ) {
      global_instance_para.currentInstance.setState({
        edit: false,
      });
    }

    global_instance_para.currentInstance = this;
  }

  componentWillUnmount() {
    super.componentWillUnmount();
    if (global_instance_para.currentInstance === this) {
      global_instance_para.currentInstance = undefined;
    }
  }
}
