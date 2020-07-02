import React, { RefObject } from "react";
import styles from "./index.less";
import imgEdited from "./img_edited.png";
import { Input, Icon } from "antd";
import { InputProps } from "antd/lib/input";
import { BaseStateComponent } from "../baseStateComponent";

interface StateInputBaseProps extends InputProps {
  editValue?: string;
  data?: any;
  edit?: boolean;
  isEdited?: boolean;
  className?: string;
  asyncUpdate?: boolean;
  editCallback?: (value: string, data?: any) => void;
}

interface StateInputState {
  edit?: boolean;
}

class StateInput extends BaseStateComponent<
  StateInputBaseProps,
  StateInputState
> {
  private inputRef: RefObject<any>;
  // 不是同步更新时使用
  private edited: boolean = false;
  private editedValue: any;
  constructor(props: StateInputBaseProps) {
    super(props);
    this.inputRef = React.createRef();

    this.state = {
      edit: false,
    };
    this.onEdit = this.onEdit.bind(this);
    this.onCancel = this.onCancel.bind(this);
    this.onSave = this.onSave.bind(this);
  }

  componentDidUpdate(prevProps: any, prevState: any, snapshot: any) {
    if (this.state.edit) {
      this.clearOtherInstantce();
    }
  }

  onEdit() {
    // 判断值是否改变
    if (this.props.editCallback) {
      this.setState({
        edit: true,
      });
    }
  }
  onCancel() {
    this.setState({
      edit: false,
    });
  }
  onSave() {
    if (!this.inputRef.current || !this.inputRef.current.input) {
      return;
    }
    const value = this.inputRef.current.input.value;
    this.setState({
      edit: false,
    });

    // 值没有改变，不更新
    if (value === this.props.editValue) {
      return;
    }

    if (this.props.asyncUpdate) {
      this.edited = true;
      this.editedValue = value;
    }

    // 执行更新操作
    if (this.props.editCallback) {
      this.props.editCallback(value, this.props.data);
    }
  }

  render() {
    const { style, maxLength, editValue, className } = this.props;

    const initValue = this.edited ? this.editedValue : editValue;
    const renderInput = () => {
      return (
        <Input
          size="small"
          ref={this.inputRef}
          defaultValue={initValue}
          style={style}
          maxLength={maxLength}
          className={className}
        />
      );
    };

    return (
      <div className="stateInput">
        {this.state.edit ? (
          renderInput()
        ) : (
          <span onDoubleClick={this.onEdit}>{initValue}</span>
        )}

        {this.state.edit ? (
          <Icon className="function-icon" type="save" onClick={this.onSave} />
        ) : (
          <Icon className="function-icon" type="edit" onClick={this.onEdit} />
        )}

        {this.state.edit ? (
          <Icon
            className="function-icon"
            type="close"
            onClick={this.onCancel}
          />
        ) : (
          ""
        )}
        {!this.state.edit && (this.edited || this.props.isEdited) ? (
          <img className={styles.edited} src={imgEdited} />
        ) : (
          ""
        )}
      </div>
    );
  }
}

export default StateInput;
