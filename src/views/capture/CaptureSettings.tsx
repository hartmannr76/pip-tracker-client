import * as React from 'react';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';
import DialogTitle from '@mui/material/DialogTitle';
import Slide from '@mui/material/Slide';
import { TransitionProps } from '@mui/material/transitions';
import { Chip, colors, Paper, Stack, Switch } from '@mui/material';
import { KeyboardArrowDown, KeyboardArrowUp, Settings } from '@mui/icons-material';

const Transition = React.forwardRef(function Transition(
    props: TransitionProps & {
      children: React.ReactElement<any, any>;
    },
    ref: React.Ref<unknown>,
  ) {
    return <Slide direction="down" ref={ref} {...props} />;
  });

  export default function CaptureSettings({livePreview=true, onPreviewChange, debug=false, onDebugChange}) {
    const [open, setOpen] = React.useState(false);
    const [livePreviewValue, setLivePreviewValue] = React.useState(livePreview);
    const [debugValue, setDebugValue] = React.useState(debug);
  
    const handleClickOpen = () => {
      setOpen(true);
    };
  
    const handleClose = () => {
      setOpen(false);
    };

    const handlePreviewChange = (evt) => {
        onPreviewChange(evt);
        setLivePreviewValue(evt.target.checked);
    }

    const handleDebugChange = (evt) => {
        onDebugChange(evt);
        setDebugValue(evt.target.checked);
    }
  
    return (
      <>
        <Chip
            label={<><Settings />{open ? <KeyboardArrowUp /> : <KeyboardArrowDown />}</>}
            onClick={open ? handleClose : handleClickOpen}
            sx={{position: 'absolute', zIndex: 99, color: colors.grey[200], right: '12px', top: '20px' }} />
        <Dialog
          open={open}
          TransitionComponent={Transition}
          keepMounted
          onClose={handleClose}
          aria-describedby="alert-dialog-slide-description"
        >
          <DialogContent>
            <Stack>
                <Stack direction="row" justifyContent="space-between" alignItems="flex-start" spacing={10}>
                    <div>Live Preview</div><Switch checked={livePreviewValue} onChange={handlePreviewChange}  />
                </Stack>
                <Stack direction="row" justifyContent="space-between" alignItems="flex-start" spacing={10}>
                    <div>Debug Mode</div><Switch checked={debugValue} onChange={handleDebugChange} />
                </Stack>
                <Stack direction="row" justifyContent="space-between" alignItems="flex-start" spacing={8}>
                    <div>Detection Speed</div><div>Coming soon</div>
                </Stack>
            </Stack>
          </DialogContent>
        </Dialog>
      </>
    );
  }