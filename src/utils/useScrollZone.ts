import { useRef, useEffect } from "react";

const useScrollZone = (scrollableRef: React.MutableRefObject<HTMLElement |null>) => {
    enum Zone {
        NONE,UP,DOWN
    };
    const scrollZone = useRef(Zone.NONE);
    const scrollSpeed = 5;
    const canHandle = useRef(false);
    const timeout: React.MutableRefObject<number|undefined> = useRef();
    const nextLocation: React.MutableRefObject<number|undefined> = useRef();

    const handleLongPressScroll = () => {
        if (!canHandle.current || scrollableRef.current === null) {
            return;
        }
        
        const currentScrollY = scrollableRef.current.scrollTop;

        let newTop: number = currentScrollY;

        if (scrollZone.current === Zone.UP) {
            newTop -= scrollSpeed;
        } else if (scrollZone.current === Zone.DOWN) {
            newTop += scrollSpeed;
        }

        if (newTop !== currentScrollY) {
            scrollableRef.current.scrollTop = newTop;
            timeout.current = window.setTimeout(handleLongPressScroll, 10);
        }
    };

    const handleLongPressTouchMove = (e: TouchEvent) => {
        if (!canHandle.current) {
            return;
        }

        const scrollDownBox = Math.floor(window.innerHeight * 0.8);
        const scrollUpBox = Math.floor(window.innerHeight * 0.2);
        const { clientY } = e.touches.item(0)!;
        if (e.cancelable) {
            e.preventDefault();
        }
        
        if (clientY >= scrollDownBox && scrollZone.current !== Zone.DOWN) {
            scrollZone.current = Zone.DOWN;
            handleLongPressScroll();
        } else if (clientY <= scrollUpBox && scrollZone.current !== Zone.UP) {
            scrollZone.current = Zone.UP;
            handleLongPressScroll();
        } else if (clientY < scrollDownBox && clientY > scrollUpBox && scrollZone.current !== Zone.NONE) {
            scrollZone.current = Zone.NONE;
        }
    };

    useEffect(() => {
        window.addEventListener('touchmove', handleLongPressTouchMove, {passive: false});
        window.addEventListener('touchend', () => {
            setShouldHandle(false);
        });

        return () => {
            window.removeEventListener('touchmove', handleLongPressTouchMove);
        };
    }, []);

    const setShouldHandle = (b: boolean) => {
        canHandle.current = b;
        const isLongClickTriggered = canHandle.current;
        if (isLongClickTriggered) {
            document.body.style.overflowX = 'hidden';
            document.documentElement.style.overflowX = 'hidden';
            document.body.style.position = 'relative';
            document.documentElement.style.position = 'relative';
            nextLocation.current = undefined;
        } else  {
                document.body.style.overflowX = '';
                document.body.style.position = '';
                document.documentElement.style.overflowX = '';
                document.documentElement.style.position = '';
        }
    };

    return {
        setShouldHandle
    };
};

export default useScrollZone;