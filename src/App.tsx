import React, {useState} from 'react';
import { SnapshotDetailsProvider } from './components/SnapshotDetails';
import {Capture} from './views/capture';
import {Preview} from './views/preview';
import {Home} from './views/home';

function App(): JSX.Element {
  const [modes, setModes] = useState<number[]>([2])
  
  const setMode = (newMode) => {
    if (newMode === 2) {
      setModes([2]);
    } else {
      setModes([newMode, ...modes]);
    }
  }

  const goBack = () => {
    setModes(modes.slice(1));
  }

  let renderMode;

  switch(modes[0]) {
    case 0:
      renderMode = <Capture setMode={setMode} goBack={goBack} />;
      break;
    case 1:
      renderMode = <Preview setMode={setMode} goBack={goBack} />;
      break;
    case 2:
      renderMode = <Home setMode={setMode} />;
      break;
  }

  return (
    <SnapshotDetailsProvider>
      {renderMode}
    </SnapshotDetailsProvider>
  );
}

export default App;
