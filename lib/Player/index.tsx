import React, { RefObject } from "react";
import shortid from "shortid";
import hlsjs from "hls.js";
import flvjs from "flv.js";
import "dplayer/dist/DPlayer.min.css";
import DPlayer from "dplayer";
import styles from "./index.less";
import { BasePureComponent } from "../BasePureComponent";
import { Icon } from "antd";
import StateImg from "../StateImg";
import AliIcon from "../AliIcon";

interface PlayerProps {
  url?: string;
  type?: "flv" | "hls";
  live: boolean;
  blankPrompt?: string;
  status?: string; // "playing" | "play" | "failed" | "loading" | "blank";
  capture?: string;
  screenshot?: boolean;
  getResource?: () => void;
  onRef?: (ref: any) => void;
}

interface PlayerState {
  status: string; // "playing" | "pending"
}

// 请保证切换视频地址的时候将key也改变，否则不能保证正确切换
class Player extends BasePureComponent<PlayerProps, PlayerState> {
  // 这个是内部key，与上面注释和react key功能不同
  private key: string = shortid.generate();
  private player?: DPlayer;
  private flvPlayer?: flvjs.Player;
  private timeHandler: any;
  private playHandler: any;
  private contentRef?: RefObject<any>;

  constructor(props: PlayerProps) {
    super(props);
    this.contentRef = React.createRef();

    if (/*props.live && */ props.url) {
      this.state = {
        status: "playing",
      };
    } else {
      this.state = {
        status: "pending",
      };
    }

    flvjs.LoggingControl.enableVerbose = false;
    flvjs.LoggingControl.enableWarn = false;
    this.screenshot = this.screenshot.bind(this);
    this.playerCallback = this.playerCallback.bind(this);
    this.handlePlay = this.handlePlay.bind(this);
    this.loadMedia = this.loadMedia.bind(this);
  }

  stopCacheCheckLoop() {
    if (this.timeHandler) {
      clearInterval(this.timeHandler);
      this.timeHandler = undefined;
    }
  }

  startCacheCheckLoop() {
    const clearCache = () => {
      if (!this.player || !this.player.video) {
        return;
      }
      const video = this.player.video;
      if (!video.paused) {
        const buffered = video.buffered;
        if (buffered && buffered.length > 0) {
          const end = buffered.end(0);
          if (end - video.currentTime > 15) {
            video.currentTime = end - 8;
          }
        }
      }
    };

    this.stopCacheCheckLoop();
    if (this.props.live) {
      this.timeHandler = setInterval(clearCache, 10000);
    }
  }

  componentDidMount() {
    const { url, type, onRef } = this.props;
    if (onRef) {
      onRef(this);
    }

    if (url /* && this.props.live*/) {
      this.initPlayer(url, type);
    }
  }

  componentDidUpdate(prevProps: PlayerProps) {
    const self = this;
    if (
      prevProps.url !== this.props.url ||
      prevProps.type !== this.props.type
    ) {
      self.destroy();

      const callback = () => {
        self.initPlayer(self.props.url, self.props.type);
      };

      if (/*self.props.live && */ self.props.url) {
        self.setState(
          {
            status: "playing",
          },
          callback,
        );
      } else {
        self.setState({
          status: "pending",
        });
      }
    }
  }

  componentWillUnmount() {
    this.stopCacheCheckLoop();
    this.destroy();
  }

  screenshot(callback: any) {
    if (!callback) {
      return;
    }
    if (!this.player || !this.player.video) {
      callback(undefined);
      return;
    }

    const canvas = document.createElement("canvas");
    canvas.width = this.player.video.videoWidth;
    canvas.height = this.player.video.videoHeight;
    const context = canvas.getContext("2d");
    if (!context) {
      console.error("cannot init screenshot canvas");
      callback(undefined);
      return;
    }
    context.drawImage(this.player.video, 0, 0, canvas.width, canvas.height);

    const dataURL = canvas.toDataURL("image/png");
    callback(dataURL);
    // canvas.toBlob((blob) => {
    //   if (blob) {
    //     const dataURL = URL.createObjectURL(blob);
    //     callback(dataURL);
    //   } else {
    //     callback(undefined);
    //   }
    // });
  }

  playerCallback() {
    if (this.flvPlayer) {
      this.flvPlayer.play();
    } else {
      if (this.player) {
        this.player.play();
      }
    }
    this.startCacheCheckLoop();
  }

  handlePlay() {
    this.initPlayer(this.props.url, this.props.type);
    this.setState({
      status: "playing",
    });
    setTimeout(() => {
      this.playerCallback();
    }, 200);
  }

  initPlayer(url?: string, type?: string) {
    const self = this;
    if (!url || !self.contentRef || !self.contentRef.current) {
      return;
    }

    let customType;
    if (type) {
      customType = {
        type: `custom${type}`,
        customType: {
          customhls: (video: any, player: any) => {
            const hls = new hlsjs();
            hls.loadSource(video.src);
            hls.attachMedia(video);
          },
          customflv: (video: any, player: any) => {
            self.flvPlayer = flvjs.createPlayer(
              {
                type: "flv",
                url: video.src,
                isLive: self.props.live,
                hasVideo: true,
                hasAudio: false,
              },
              {
                enableWorker: true,
                enableStashBuffer: false,
                stashInitialSize: 16,
                autoCleanupSourceBuffer: true,
              },
            );
            self.flvPlayer.attachMediaElement(video);
            self.flvPlayer.load();
            self.playHandler = setTimeout(self.playerCallback, 200);
          },
        },
      };
    } else {
      customType = {};
    }

    this.player = new DPlayer({
      container: self.contentRef.current,
      autoplay: true,
      theme: "#FADFA3",
      live: this.props.live,
      loop: !this.props.live,
      lang: "zh-cn",
      screenshot: true,
      hotkey: false,
      preload: "auto",
      volume: 0.7,
      mutex: false,
      video: {
        url,
        ...customType,
      },
    });

    if (!type) {
      self.playHandler = setTimeout(self.playerCallback, 200);
    }
  }

  destroy() {
    clearInterval(this.timeHandler);
    clearTimeout(this.playHandler);
    if (this.player) {
      if (this.flvPlayer) {
        this.flvPlayer.destroy();
        this.flvPlayer = undefined;
      }
      this.player.destroy();
      this.player = undefined;
      console.log(`Destroy the player ${this.key} success`);
    }
  }

  loadMedia() {
    const { getResource } = this.props;
    if (getResource) {
      getResource();
    }
  }

  renderCover() {
    if (this.state.status === "playing") {
      return null;
    }

    const extProps: any = {};
    if (!this.props.capture) {
      extProps.style = {
        backgroundColor: "#000",
      };
    }

    return (
      <div className={styles.cover}>
        {this.props.capture && <StateImg src={this.props.capture} />}
        {this.props.status === "play" && (
          <div className={styles.play} onClick={this.handlePlay}>
            <div>
              <AliIcon type="icon-play" />
            </div>
            <div className="gvAlignMiddle" />
          </div>
        )}
        {this.props.status === "failed" && (
          <div className={styles.failed}>
            <div>
              <AliIcon type="icon-brokenimage" />
              <div>
                视频加载失败，点击
                <a href="#!" onClick={this.loadMedia}>
                  重新加载
                </a>
              </div>
            </div>
            <div className="gvAlignMiddle" />
          </div>
        )}
        {this.props.status === "loading" && (
          <div className={styles.loading}>
            <div>
              <AliIcon type="icon-loading" spin={true} />
              <div>视频加载中</div>
            </div>
            <div className="gvAlignMiddle" />
          </div>
        )}
        {this.props.status === "blank" && (
          <div className={styles.blank} {...extProps} onClick={this.loadMedia}>
            <Icon type="sync" />
            <div>{this.props.blankPrompt || "加载视频"}</div>
            <div className="gvAlignMiddle" />
          </div>
        )}
      </div>
    );
  }

  render() {
    return (
      <div className={styles.video}>
        <div ref={this.contentRef} />
        {this.renderCover()}
      </div>
    );
  }
}

export default Player;
