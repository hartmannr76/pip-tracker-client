import React, {useRef, useState, useEffect, useContext, useReducer} from 'react';
import { drawRect } from '../../utils/drawing';
import { saveOrUpdateSnapshot, snapshotDetailsContext } from '../../components/SnapshotDetails';
import { IBoundingBoxProps, SnapshotContextType } from '../../types';
import { Grid, Button, Tab, Tabs, IconButton, colors } from '@mui/material';
import { CheckCircle, Cancel, Edit, ArrowCircleLeftOutlined } from '@mui/icons-material';
import EditPipClusterDialog from './EditPipClusterDialog';
import { model } from 'ai';

function Preview({setMode, goBack}: {setMode: (mode: number) => void, goBack: () => void}) {
    const canvasRef: React.MutableRefObject<HTMLCanvasElement |null> = useRef(null);
    const [currentTab, setTab] = useState(0);
    const [_, forceUpdate] = useReducer((x) => x + 1, 0);
    const [editMenuBoundBox, setEditMenuBoundingBox] = useState<[IBoundingBoxProps, number]|null>(null);
  
    const {activeSnapshot: currentSnapshot} = useContext(snapshotDetailsContext) as SnapshotContextType;
    if (!currentSnapshot) throw new Error('Cannot render without an active snapshot');
    const currentTotal = currentSnapshot.boundingBoxProps.reduce((prev, curr) => prev + curr.pipValue, 0);
  
    // Calculate the average box size for when a user wants to add a new value
    // to the image set.
    const sizeTotals = currentSnapshot.boundingBoxProps.reduce((prev, curr) => ({
      allHeight: prev.allHeight + (curr.ymax-curr.ymin),
      allWidth: prev.allWidth + (curr.xmax-curr.xmin)
    }), {allHeight:0, allWidth: 0});
  
    const averageBoxWidth = sizeTotals.allWidth/currentSnapshot.boundingBoxProps.length;
    const averageBoxHeight = sizeTotals.allHeight/currentSnapshot.boundingBoxProps.length;
  
    useEffect(() => {
      if (canvasRef.current !== null) {
        const ctx = canvasRef.current.getContext("2d");
        ctx?.clearRect(0, 0, currentSnapshot.imageWidth, currentSnapshot.imageHeight);
        drawRect(currentSnapshot.boundingBoxProps, ctx, {highlightIndex: currentTab});
        canvasRef.current.addEventListener('touchstart', handleTouchStart);
      }
  
      return () => {
        if (canvasRef.current !== null) {
          canvasRef.current.removeEventListener('touchstart', handleTouchStart);
        }
      }
    });
  
    const handleTouchStart = (evt: TouchEvent) => {
      if (evt.targetTouches.length === 1) {
          const touch = evt.targetTouches[0];
          const boxIndex = currentSnapshot.boundingBoxProps.findIndex(box => 
            box.xmin <= touch.clientX && box.xmax >= touch.clientX &&
            box.ymin <= touch.clientY && box.ymax >= touch.clientY
          );
  
          if (boxIndex >= 0) {
            setTab(boxIndex);
          } else {
            // are they trying to add a new box?
            const xmin = Math.round(touch.clientX-(averageBoxWidth/2));
            const ymin = Math.round(touch.clientY-(averageBoxHeight/2));
            const newBoundingBox: IBoundingBoxProps = {
              class: '1',
              classIndex: 0,
              pipValue: 0,
              xmin,
              xmax: xmin + averageBoxWidth,
              ymin,
              ymax: ymin + averageBoxHeight,
              predictedLabel: 'None'
            };
            setEditMenuBoundingBox([newBoundingBox, -1]);
          }
      } 
    }
  
    const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
      setTab(newValue);
    }
  
    const handleCancel = () => goBack();

    const handleRemoveBoundingBox = () => {
      currentSnapshot.boundingBoxProps.splice(currentTab, 1);
      if (currentTab === 0) {
        forceUpdate()
      } else {
        setTab(currentTab-1);
      }
    }

    const handleAcceptScore = async () => {
      await saveOrUpdateSnapshot(currentSnapshot);
      setMode(2)
    }
  
    const onCompleteEdit = () => {}
    const onDialogCancel = () => { 
      setEditMenuBoundingBox(null);
    }
    const onDialogComplete = (result) => { 
      editMenuBoundBox![0].classIndex = result;
      editMenuBoundBox![0].pipValue = model.labelMap[result].displayValue;
      editMenuBoundBox![0].class = model.labelMap[result].name;

      if (editMenuBoundBox![1] === -1) {
        currentSnapshot.boundingBoxProps.push(editMenuBoundBox![0]);
        setTab(currentSnapshot.boundingBoxProps.length-1);
      }
      
      setEditMenuBoundingBox(null);
    }

    const onClickEditBoundingBox = () => {
      setEditMenuBoundingBox([currentSnapshot.boundingBoxProps[currentTab], currentTab]);
    }
  
    return (
      <div id="container">
        <IconButton onClick={handleCancel} sx={{position: 'absolute', zIndex: 99, color: colors.grey[200], left: '12px', top: '12px' }}>
          <ArrowCircleLeftOutlined fontSize='large' />
        </IconButton>
        <div id="vid_container">
          <img src={currentSnapshot.imageData} style={{height:'100%', width: '100%'}} />
          <canvas id='video_overlay' ref={canvasRef} height={currentSnapshot.imageHeight} width={currentSnapshot.imageWidth} />
        </div>
        <div id='gui_controls'>
          <Grid container direction="column" justifyContent="space-between" alignItems="flex-start" margin={0} height="100%">
            <Grid item width="100%">
              <Tabs 
                value={currentTab} 
                onChange={handleTabChange} 
                variant='scrollable' 
                scrollButtons='auto'
                >
                  {currentSnapshot.boundingBoxProps.map(box => 
                  <Tab 
                    label={box.pipValue}
                    disableRipple
                  />)}
              </Tabs>
            </Grid>
            <Grid container item columnSpacing={3} direction="row" justifyContent="space-around" alignItems="center" marginBottom="20px">
                <Grid item>
                  <Button variant='contained' startIcon={<CheckCircle />} color="success" onClick={handleAcceptScore}>
                    {currentTotal}
                  </Button>
                </Grid>
                {currentSnapshot.boundingBoxProps && currentSnapshot.boundingBoxProps.length > 0 && 
                  <>
                  <Grid item>
                    <Button variant='contained' startIcon={<Cancel />} color="error" onClick={handleRemoveBoundingBox}>
                      Remove
                    </Button>
                  </Grid>
                  <Grid item>
                    <Button variant='contained' startIcon={<Edit />} color="info" onClick={onClickEditBoundingBox}>
                      {currentSnapshot.boundingBoxProps[currentTab].pipValue.toString().padStart(2, '\u00a0')}
                    </Button>
                  </Grid>
                  </>
                  }
            </Grid>
          </Grid>
        </div>
        <EditPipClusterDialog 
          open={editMenuBoundBox!==null} 
          onClose={onCompleteEdit} 
          onCancel={onDialogCancel} 
          onComplete={onDialogComplete}
          value={editMenuBoundBox !== null && editMenuBoundBox.length > 0 ? editMenuBoundBox[0].classIndex : null} />
      </div>
    )
  };
  export default Preview;