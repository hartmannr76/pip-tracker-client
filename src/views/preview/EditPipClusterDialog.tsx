import { Button, Dialog, DialogActions, DialogTitle, FormControl, Select, MenuItem, SelectChangeEvent } from '@mui/material';
import { useEffect, useState } from 'react';
import { model } from 'ai';

function EditPipClusterDialog({open, onClose, onCancel, onComplete, value}) {
    const [selectedValue, setSelectedValue] = useState<number|null>(null);

    useEffect(() => {
        setSelectedValue(value);
    }, [value]);

    const handleOnChange = (evt: SelectChangeEvent<typeof selectedValue|string>) => {
        setSelectedValue(Number(evt.target.value));
    }

    const handleOnComplete = () => {
        onComplete(selectedValue);
    }

    return (
        <Dialog open={open} onClose={onClose} maxWidth="xs" sx={{ '& .MuiDialog-paper': { width: '80%'}}}>
              <DialogTitle>Edit selection</DialogTitle>
              <FormControl>
                <Select value={selectedValue ?? ''} onChange={handleOnChange}>
                  {Object.keys(model.labelMap).map(k => <MenuItem value={k}>{model.labelMap[k].displayValue}</MenuItem>)}
                </Select>
              </FormControl>
              <DialogActions>
                <Button disableElevation onClick={onCancel}>Cancel</Button>
                <Button disableElevation onClick={handleOnComplete}>OK</Button>
              </DialogActions>
        </Dialog>
    );
};

export default EditPipClusterDialog;