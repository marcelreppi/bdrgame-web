export function throttle(callback, delay) {
    let previousCall = new Date().getTime();
    return function() {
      let currentCall = new Date().getTime();

      if ((currentCall - previousCall) >= delay) {
        previousCall = currentCall;
        callback.apply(null, arguments);
      }
    };
  }

export function getEuclidianDistance(a, b) {
    return Math.sqrt(Math.pow(b.x - a.x, 2) + Math.pow(b.y - a.y, 2))
  }

export function partial(fn, ...partialArgs){  
  return function(...otherArgs){
    const fnArgs = partialArgs.concat(otherArgs);
    fn.apply(null, fnArgs);  
  }
}