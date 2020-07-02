import React from "react";

export class BasePureComponent<
  P = {},
  S = {},
  SS = any
> extends React.PureComponent<P, S, SS> {
  constructor(props: P) {
    super(props);
  }

  componentWillUnmount() {
    this.setState = () => {
      console.log("setState called after unmount");
    };
  }
}
