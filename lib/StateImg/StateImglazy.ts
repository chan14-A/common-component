interface ObserveReference {
  observer: IntersectionObserver;
  refCount: number;
}

export default (() => {
  const spectorList: ObserveReference[] = [];

  const handleCallback = (entrys: any[], observe: IntersectionObserver) => {
    for (const e of entrys) {
      if (e.intersectionRatio > 0) {
        const callback = e.target.lazyCall;
        if (callback) {
          callback();
        }
        unbound(observe, e.target);
      }
    }
  };

  const getObserve = (containerDom: any) => {
    for (const e of spectorList) {
      if (e.observer.root === containerDom) {
        return e;
      }
    }

    return createObserve(containerDom);
  };

  const getObserveByObserve = (observe: IntersectionObserver) => {
    for (const e of spectorList) {
      if (e.observer === observe) {
        return e;
      }
    }

    return undefined;
  };

  const removeObserve = (ref: ObserveReference) => {
    const index = spectorList.indexOf(ref);
    if (index !== -1) {
      spectorList.splice(index, 1);
    }
  };

  function createObserve(containerDom: any) {
    const observer = new IntersectionObserver(handleCallback, {
      root: containerDom,
      threshold: 0.01,
      rootMargin: "10px 10px 10px 10px",
    });
    const ref = {
      observer,
      refCount: 0,
    };
    spectorList.push(ref);

    return ref;
  }

  function bound(containerDom: any, sourceDom: any, callback: any) {
    const ref = getObserve(containerDom);

    sourceDom.lazyCall = callback;
    ref.observer.observe(sourceDom);
    ref.refCount++;
    return ref;
  }

  function unbound(observe: IntersectionObserver, sourceDom: any) {
    const ref = getObserveByObserve(observe);
    if (!ref) return;
    observe.unobserve(sourceDom);
    ref.refCount--;
    if (ref.refCount < 1) {
      observe.disconnect();
      removeObserve(ref);
    }
  }

  return {
    bound,
    unbound,
  };
})();
