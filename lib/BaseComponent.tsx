import React from "react";

export class BaseComponent<P = {}, S = {}, SS = any> extends React.Component<
  P,
  S,
  SS
> {
  private unmounted: boolean = false;
  constructor(props: P) {
    super(props);
  }

  componentWillUnmount() {
    if (this.unmounted) {
      // TODO debug用
      console.log("unmount was called twice." + this.toString());
    } else {
      this.unmounted = true;
    }
    this.setState = () => {
      console.log("setState called after unmount");
    };
  }
}
