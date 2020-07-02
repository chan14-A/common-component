import styles from "./index.less";
import $ from "jquery";

class Magnifier {
  private contentRef: any;
  private $dom: any;
  private $innerDiv: any;
  private $outerDiv: any;
  private $outerImg: any;
  private width: number;
  private height: number;
  private position: any;
  private realWidth: number;
  private realHeight: number;
  private pointWidth: number;
  private pointHeight: number;
  private inited: boolean;

  constructor(contentRef: any, realWidth: number, realHeight: number) {
    this.width = 0;
    this.height = 0;
    this.position = {};
    this.realWidth = 0;
    this.realHeight = 0;
    this.pointWidth = 0;
    this.pointHeight = 0;
    this.inited = false;

    if (!realWidth || !realHeight) {
      return;
    }
    this.contentRef = contentRef;
    this.$dom = $(this.contentRef.current);
    this.inited = false;
    this.realWidth = realWidth;
    this.realHeight = realHeight;
    this.magnifier = this.magnifier.bind(this);
    this.magnifierMouseOut = this.magnifierMouseOut.bind(this);
    this.startMagnifier();
  }

  init() {
    if (!this.contentRef.current) {
      return;
    }
    if (this.inited) {
      return true;
    } else {
      this.inited = true;
    }
    this.$innerDiv = this.$dom.find("." + styles.innerMagnifier);
    this.$outerDiv = this.$dom.find("." + styles.outerMagnifier);
    this.$outerImg = this.$outerDiv.find("img");
    const $img = this.$dom.children().filter("img");
    this.width = $img.width();
    this.height = $img.height();
    this.position = $img.position();
    const offset = $img.offset();
    if (!this.width || !this.height || !this.position || !offset) {
      return false;
    }
    if (!this.realWidth || !this.realHeight) {
      return false;
    }
    this.pointWidth = (this.width / this.realWidth) * this.width;
    this.pointHeight = (this.pointWidth * this.height) / this.width;
    this.$innerDiv.css("width", this.pointWidth + "px");
    this.$innerDiv.css("height", this.pointHeight + "px");
    this.$outerDiv.css("width", this.width + "px");
    this.$outerDiv.css("height", this.height + "px");
    const winWidth = $(window).width() || 0;
    if (!winWidth) {
      return false;
    }

    const rightWidth = winWidth - offset.left - this.width;
    let outerLeft = offset.left + this.width + 80;
    if (rightWidth < offset.left) {
      outerLeft = offset.left - this.width - 80;
    }
    this.$outerDiv.css("top", offset.top + "px");
    this.$outerDiv.css("left", outerLeft + "px");
    this.$innerDiv.show();
    this.$outerDiv.show();
    return true;
  }

  magnifier(event: any) {
    event.preventDefault();
    event.stopPropagation();
    if (!this.init()) {
      this.magnifierMouseOut();
      return;
    }
    const { offsetX, offsetY } = event;

    const position = this.position;
    if (
      offsetX < position.left ||
      offsetY < position.top ||
      offsetX > position.left + this.width ||
      offsetY > position.top + this.height
    ) {
      this.magnifierMouseOut();
      return;
    }

    let left = offsetX - this.pointWidth / 2;
    let top = offsetY - this.pointHeight / 2;
    if (left < position.left) {
      left = position.left;
    }
    let tmp = left + this.pointWidth - (position.left + this.width);
    if (tmp > 0) {
      left -= tmp;
    }

    if (top < position.top) {
      top = position.top;
    }
    tmp = top + this.pointHeight - (position.top + this.height);
    if (tmp > 0) {
      top -= tmp;
    }
    this.$innerDiv.css("top", top + "px");
    this.$innerDiv.css("left", left + "px");

    left = (((left - position.left) * this.realWidth) / this.width) * -1;
    top = (((top - position.top) * this.realHeight) / this.height) * -1;
    this.$outerImg.css("top", top + "px");
    this.$outerImg.css("left", left + "px");

    return false;
  }

  magnifierMouseOut() {
    if (this.$innerDiv) {
      this.$innerDiv.hide();
    }

    if (this.$outerDiv) {
      this.$outerDiv.hide();
    }

    this.inited = false;
  }

  stopMagnifier() {
    this.$dom.off("mousemove", this.magnifier);
    this.$dom.off("mouseleave", this.magnifierMouseOut);
  }

  startMagnifier() {
    this.stopMagnifier();
    this.$dom.on("mousemove", this.magnifier);
    this.$dom.on("mouseleave", this.magnifierMouseOut);
  }
}

export default Magnifier;
