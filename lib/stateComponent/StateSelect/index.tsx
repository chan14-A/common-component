import React, { RefObject } from "react";
import styles from "./index.less";
import imgEdited from "./img_edited.png";
import { Select, Icon } from "antd";
import { SelectProps } from "antd/lib/select";
import { BaseStateComponent } from "../baseStateComponent";

export interface StateSelectOptionProp {
  id: string | number;
  value: string | number;
  name: string;
}

interface StateSelectBaseProps extends SelectProps {
  editValue?: string | number;
  editName?: string;
  edit?: boolean;
  isEdited?: boolean;
  className?: string;
  listItem: StateSelectOptionProp[];
  // 不是同步更新时使用
  asyncUpdate?: boolean;
  dataId?: any;
  listPropName?: string;
  listContentName?: string;
  editCallback?: (value: string | number, dataId?: any) => void;
}

interface StateSelectState {
  edit?: boolean;
}

class StateSelect extends BaseStateComponent<
  StateSelectBaseProps,
  StateSelectState
> {
  private inputRef: RefObject<any>;
  // 不是同步更新时使用
  private edited: boolean = false;
  private editedValue: any;
  private editedName: any;
  constructor(props: StateSelectBaseProps) {
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

  onSave = (value: string | number) => {
    this.setState({
      edit: false,
    });

    // 值没有改变，不更新
    if (value === this.props.editValue) {
      return;
    }

    const key = this.props.listPropName || "value";
    const contentKey = this.props.listContentName || "name";

    if (this.props.asyncUpdate) {
      this.edited = true;
      this.editedValue = value;
      for (const item of this.props.listItem) {
        if (item[key] === value) {
          this.editedName = item[contentKey];
          break;
        }
      }
    }

    // 执行更新操作
    if (this.props.editCallback) {
      this.props.editCallback(value, this.props.dataId);
    }
  };

  render() {
    const { style, editValue, className } = this.props;
    const { Option } = Select;

    const initValue = this.edited ? this.editedValue : editValue;

    const key = this.props.listPropName || "value";
    const contentKey = this.props.listContentName || "name";
    const renderSelect = () => {
      if (!this.props.listItem) {
        return "";
      }

      return (
        <span>
          <Select
            ref={this.inputRef}
            defaultValue={initValue}
            size="small"
            dropdownClassName="stateSelectOption"
            onChange={this.onSave}
            {...{ style, className }}
            dropdownMatchSelectWidth={false}
          >
            {this.props.listItem.map((item: StateSelectOptionProp) => {
              return (
                <Option key={item[key].toString()} value={item[key]}>
                  {item[contentKey]}
                </Option>
              );
            })}
          </Select>
        </span>
      );
    };

    return (
      <div className="stateSelect">
        {this.state.edit ? (
          renderSelect()
        ) : (
          <span onDoubleClick={this.onEdit}>
            {this.edited ? this.editedName : this.props.editName}
          </span>
        )}

        {this.state.edit ? (
          <Icon
            className="function-icon"
            type="close"
            onClick={this.onCancel}
          />
        ) : (
          <Icon className="function-icon" type="edit" onClick={this.onEdit} />
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

export default StateSelect;
