import React, {useRef, useEffect, useContext} from 'react';
import {GraphModel} from "@tensorflow/tfjs";
import Webcam from "react-webcam";
import {colors, IconButton} from '@mui/material';
import {ArrowCircleLeftOutlined, PhotoCamera} from '@mui/icons-material';
import { SnapshotContextType} from 'types';
import { drawRect } from 'utils/drawing';
import { snapshotDetailsContext } from 'components/SnapshotDetails';
import { model } from 'ai';
import CaptureSettings from './CaptureSettings';

function Capture({setMode, goBack}: {setMode: (mode: number) => void, goBack: () => void}) {
    const webcamRef: React.MutableRefObject<Webcam|null> = useRef(null);
    const canvasRef: React.MutableRefObject<HTMLCanvasElement |null> = useRef(null);
    const {setActiveSnapshot} = useContext(snapshotDetailsContext) as SnapshotContextType;
    let warmupCount = 0;
    const warmupMax = 10;
    let avg: null|number = null;
    let debug = useRef(false);
    let livePreview = useRef(true);
  
    let canvasCtx: any = null;
    let canvasDraw: HTMLCanvasElement|null = null;
    let isWaiting = false;
    let net: GraphModel|null = null
  
    // Main function
    const runCoco = () => {
      // Loop and detect
      return setInterval(async () => {
        net = await model.load();
        if (livePreview.current) {
          detect();
        } 
        else if (webcamRef.current?.video && canvasRef.current) {
          const ctx = canvasRef.current.getContext("2d");
          ctx?.clearRect(0, 0, webcamRef.current.video.offsetWidth, webcamRef.current.video.offsetHeight);
        }
      }, 16);
    };
  
    const detect = async () => {
      // Check data is availablee
      if (
        typeof webcamRef.current !== "undefined" &&
        webcamRef.current !== null &&
        webcamRef.current.video !== null &&
        webcamRef.current.video.readyState === 4 &&
        canvasRef.current !== null &&
        net !== null &&
        !isWaiting
      ) {
        isWaiting = true;
        // Get Video Properties
        const video = webcamRef.current.video;
  
        // Set canvas height and width
        if (canvasRef.current.width !== video.offsetWidth && canvasRef.current.height !== video.offsetHeight) {
          canvasRef.current.width = video.offsetWidth;
          canvasRef.current.height = video.offsetHeight;
        }
        
        const start = new Date();
        const results = await model.predictAndGetResults(getCanvas(video)!, 0.65, video.offsetHeight, video.offsetWidth);
        if (warmupCount < warmupMax) {
          warmupCount++;
        } else {
          if (!avg) {
            avg = (new Date()).getTime() - start.getTime();
          } else {
            avg = (avg + (new Date()).getTime() - start.getTime())/2;
          }
        }

        // Draw mesh
        const ctx = canvasRef.current?.getContext("2d");
        requestAnimationFrame(()=>{
          if (ctx) {
            ctx.clearRect(0, 0, video.offsetWidth, video.offsetHeight);
            drawRect(results, ctx, {debug: debug.current});
            ctx.font = '12px sans-serif';
            ctx.fillStyle = 'white';
            const fps = debug.current && avg ? ' - FPS: ' + Math.round(1/(avg/1000)) : '';
            ctx.fillText('Total - ' + results.reduce((p, r) => p + r.pipValue, 0) + fps
            , 0, video.offsetHeight-14)
          }
        }); 
  
        isWaiting = false;
      }
    };
  
  
    const getCanvas = (video: HTMLVideoElement) => {
  
      if (!video) {
        return null;
      }
  
      if (!video.videoHeight) return null;
  
      // source = original large sized webcam image
      // target = large size scaled image to browser window
      // destination = cropped window image as canvas
  
      const targetWidth = Math.floor(video.offsetHeight/(video.videoHeight/video.videoWidth));
      const targetOffsetX = Math.floor((targetWidth - video.offsetWidth)/2);
    
      const sourceWindowedWidth = (video.videoWidth/targetWidth) * video.offsetWidth;
      const sourceOffset = (video.videoWidth/targetWidth) * targetOffsetX;
  
      if (!canvasCtx) {
        let canvasWidth = video.videoWidth;
        let canvasHeight = video.videoHeight;
        const aspectRatio = canvasWidth / canvasHeight;
  
        canvasWidth = video.clientWidth;
        canvasHeight = canvasWidth / aspectRatio;
  
  
        canvasDraw = document.createElement("canvas");
        canvasDraw.width = sourceWindowedWidth;
        canvasDraw.height = video.videoHeight;
        canvasCtx = canvasDraw.getContext("2d");
      }
  
      if (canvasCtx && canvasDraw) {
        canvasCtx.imageSmoothingEnabled = true;
        canvasCtx.drawImage(video, 
          Math.floor(sourceOffset), 0, 
          Math.floor(sourceWindowedWidth), video.videoHeight, 
          0, 0,
          sourceWindowedWidth, video.videoHeight 
          );
      }
  
      return canvasDraw;
    };
  
    useEffect(()=>{
      const loop = runCoco();
      return () => {
        window.clearInterval(loop);
      }
    },[]);
  
    const snapsot = async () => {
      const video = webcamRef.current!.video!;
      const drawn = getCanvas(video);
      const results = await model.predictAndGetResults(drawn!, 0.65, video.offsetHeight, video.offsetWidth);
      
      if (gtag) {
        gtag('event', 'FPS', {
          event_label: Math.floor(avg || 0).toFixed(2),
          event_category: 'Capture',
        });
      }

      setActiveSnapshot({ 
        imageData: drawn!.toDataURL('image/jpeg'),
         boundingBoxProps: results.sort((l, r) => l.xmin - r.xmin),
         imageWidth: video.offsetWidth,
         imageHeight: video.offsetHeight,
      });
      setMode(1);
    }

    const handleCancel = () => goBack();

    const handleLivePreviewChange = (evt) => {
      livePreview.current = evt.target.checked;
    }
    const handleDebugChange = (evt) => {
      debug.current = evt.target.checked;
    }
  
    const idealSize = 1280;
  
    return (
      <div id="container">
        <div id="vid_container">
          <IconButton onClick={handleCancel} sx={{position: 'absolute', zIndex: 99, color: colors.grey[200], left: '12px', top: '12px' }}>
            <ArrowCircleLeftOutlined fontSize='large' />
          </IconButton>
          <CaptureSettings onPreviewChange={handleLivePreviewChange} onDebugChange={handleDebugChange} livePreview={livePreview.current} debug={debug.current}  />
          <Webcam
            ref={webcamRef}
            muted={true} 
            id='video'
            audio={false}
            videoConstraints={{
              facingMode: { ideal: "environment" },
              width: { ideal: idealSize },
              height: { ideal: idealSize },
            }}
          />
          <canvas
            ref={canvasRef}
            id='video_overlay'
          />
        </div>
        <div id='gui_controls'>
  
          <IconButton size='large' id='take_photo' onClick={snapsot}>
            <PhotoCamera fontSize='inherit' />
          </IconButton>
        </div>
      </div>
    );
}

export default Capture;