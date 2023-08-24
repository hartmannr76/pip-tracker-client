import React, { useCallback, useRef, useState } from "react";

const useLongPress = (
  onLongPress,
  onLongPressEnd,
  onClick,
  onTouchMove,
  { shouldPreventDefault = true, delay = 300 } = {}
) => {
  const [longPressTriggered, setLongPressTriggered] = useState(false);
  const [moveTriggered, setMoveTriggered] = useState(false);
  const timeout: React.MutableRefObject<ReturnType<typeof setTimeout>|undefined> = useRef();
  const target: React.MutableRefObject<EventTarget|undefined> = useRef();

  const start = useCallback(
    event => {
      if (shouldPreventDefault && event.currentTarget) {
        event.currentTarget.addEventListener("touchend", preventDefault, {
          passive: false
        });
        target.current = event.currentTarget;
      }
      timeout.current = setTimeout(() => {
        event.currentTarget = target.current;
        onLongPress(event);
        setLongPressTriggered(true);
      }, delay);
      setMoveTriggered(false);
    },
    [onLongPress, delay, shouldPreventDefault]
  );

  const clear = useCallback(
    (event, shouldTriggerClick = true) => {
      timeout.current && clearTimeout(timeout.current);
      shouldTriggerClick && !longPressTriggered && !moveTriggered && onClick(event);
      shouldTriggerClick && longPressTriggered && onLongPressEnd();
      setLongPressTriggered(false);
      if (shouldPreventDefault && target.current) {
        target.current.removeEventListener("touchend", preventDefault);
      }
    },
    [shouldPreventDefault, onClick, longPressTriggered]
  );

  return {
    onMouseDown: e => start(e),
    onTouchStart: e => start(e),
    onMouseUp: e => clear(e),
    onMouseLeave: e => clear(e, false),
    onTouchEnd: e => clear(e),
    onTouchCancel: e => clear(e, false),
    onTouchMove: e => {
      if (!longPressTriggered) {
        setMoveTriggered(true);
        clear(e, false);
      }
      onTouchMove(e);
    }
  };
};

const isTouchEvent = event => {
  return "touches" in event;
};

const preventDefault = event => {
  if (!isTouchEvent(event)) return;

  if (event.touches.length < 2 && event.preventDefault && event.cancelable) {
    event.preventDefault();
  }
};

export default useLongPress;
